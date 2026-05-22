/**
 * A2A Client for Testing
 *
 * A simple client to interact with your A2A server.
 * Demonstrates the A2A protocol flow:
 *
 * 1. Discovery: Fetch agent card to learn capabilities
 * 2. Messages: Send messages with contextId for multi-turn conversations
 * 3. Streaming: Receive real-time responses via SSE
 *
 * Usage:
 *   npx tsx src/a2a-client.ts              # Run demo
 *   npx tsx src/a2a-client.ts -i           # Interactive mode
 *   npx tsx src/a2a-client.ts -d           # Show agent card only
 *   npx tsx src/a2a-client.ts -t           # Run test suite
 *   npx tsx src/a2a-client.ts -v           # Verbose mode (show JSON-RPC payloads)
 */

import 'dotenv/config';

// ============================================================================
// Configuration
// ============================================================================

const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

function log(message: string, data?: unknown) {
  if (VERBOSE) {
    console.log(`[DEBUG] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// Types
// ============================================================================

interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
  }>;
  authentication?: {
    schemes: string[];
  };
}

interface Task {
  id: string;
  contextId: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  messages: Array<{
    role: 'user' | 'agent';
    parts: Array<{ type: 'text'; text: string }>;
  }>;
  artifacts: Array<{
    name: string;
    parts: Array<{ type: 'text'; text: string }>;
  }>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: Task;
  error?: { code: number; message: string };
  id: number;
}

// ============================================================================
// A2A Client Class
// ============================================================================

class A2AClient {
  private baseUrl: string;
  private currentContextId?: string;
  private requestId = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Discover agent capabilities via Agent Card
   * This endpoint is always free (no payment required)
   */
  async discover(): Promise<AgentCard> {
    const response = await fetch(`${this.baseUrl}/.well-known/agent-card.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent card: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Send a message to the agent
   * Returns a Task object with status and response
   */
  async send(text: string, options?: {
    contextId?: string;
    streaming?: boolean;
  }): Promise<Task> {
    const contextId = options?.contextId || this.currentContextId;

    const payload = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          role: 'user',
          parts: [{ type: 'text', text }],
        },
        configuration: {
          ...(contextId && { contextId }),
          streaming: options?.streaming || false,
        },
      },
      id: ++this.requestId,
    };

    log('Sending request', payload);

    if (options?.streaming) {
      return this.handleStreaming(payload);
    }

    const response = await fetch(`${this.baseUrl}/a2a`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 402) {
      const paymentInfo = await response.json();
      log('Payment required (402)', paymentInfo);
      throw new PaymentRequiredError(paymentInfo);
    }

    const result: JsonRpcResponse = await response.json();
    log('Received response', result);

    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }

    const task = result.result!;
    this.currentContextId = task.contextId;
    return task;
  }

  /**
   * Handle SSE streaming response
   */
  private async handleStreaming(payload: object): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/a2a`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 402) {
      throw new PaymentRequiredError(await response.json());
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let lastTask: Task | null = null;
    let buffer = '';

    process.stdout.write('Agent: ');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed: JsonRpcResponse = JSON.parse(data);
            if (parsed.result) {
              lastTask = parsed.result;
              const agentMsg = lastTask.messages.find(m => m.role === 'agent');
              if (agentMsg) {
                process.stdout.write(`\rAgent: ${agentMsg.parts[0].text}`);
              }
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    console.log('\n');

    if (!lastTask) throw new Error('No task received');
    this.currentContextId = lastTask.contextId;
    return lastTask;
  }

  /**
   * Stream response as async generator
   */
  async *stream(text: string): AsyncGenerator<string> {
    const payload = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          role: 'user',
          parts: [{ type: 'text', text }],
        },
        configuration: {
          contextId: this.currentContextId,
          streaming: true,
        },
      },
      id: ++this.requestId,
    };

    const response = await fetch(`${this.baseUrl}/a2a`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 402) {
      throw new PaymentRequiredError(await response.json());
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let lastText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed: JsonRpcResponse = JSON.parse(data);
            if (parsed.result) {
              this.currentContextId = parsed.result.contextId;
              const agentMsg = parsed.result.messages.find(m => m.role === 'agent');
              if (agentMsg) {
                const newText = agentMsg.parts[0].text;
                if (newText.length > lastText.length) {
                  yield newText.slice(lastText.length);
                  lastText = newText;
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  /**
   * Continue conversation using existing context
   */
  continue(text: string, streaming = false): Promise<Task> {
    if (!this.currentContextId) {
      throw new Error('No active conversation. Call send() first.');
    }
    return this.send(text, { contextId: this.currentContextId, streaming });
  }

  /**
   * Start a new conversation (clears context)
   */
  newConversation(): void {
    this.currentContextId = undefined;
  }

  /**
   * Get current context ID
   */
  getContextId(): string | undefined {
    return this.currentContextId;
  }
}

/**
 * Error thrown when payment is required (402)
 */
class PaymentRequiredError extends Error {
  public paymentInfo: unknown;

  constructor(paymentInfo: unknown) {
    super('Payment required');
    this.name = 'PaymentRequiredError';
    this.paymentInfo = paymentInfo;
  }
}

// ============================================================================
// CLI Commands
// ============================================================================

async function discoverCommand(client: A2AClient) {
  console.log('\n--- Agent Discovery ---\n');

  const card = await client.discover();

  console.log(`Name: ${card.name}`);
  console.log(`Description: ${card.description}`);
  console.log(`Version: ${card.version}`);
  console.log(`\nCapabilities:`);
  console.log(`  Streaming: ${card.capabilities.streaming}`);
  console.log(`\nSkills:`);
  card.skills.forEach(skill => {
    console.log(`  - ${skill.name}`);
    console.log(`    ${skill.description}`);
    if (skill.examples.length) {
      console.log(`    Examples: ${skill.examples.join(', ')}`);
    }
  });
  console.log(`\nAuthentication: ${card.authentication?.schemes?.join(', ') || 'none'}`);
}

async function chatCommand(client: A2AClient) {
  const readline = await import('readline');

  const card = await client.discover();
  console.log(`\nConnected to: ${card.name}`);
  console.log(`Skills: ${card.skills.map(s => s.id).join(', ')}`);
  const showHelp = () => {
    console.log(`\nCommands:`);
    console.log(`  /help     Show this help message`);
    console.log(`  /new      Start new conversation`);
    console.log(`  /stream   Toggle streaming mode`);
    console.log(`  /context  Show current context ID`);
    console.log(`  /exit     Exit\n`);
  };

  showHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let streaming = false;

  const prompt = () => {
    rl.question('You: ', async (input) => {
      const text = input.trim();
      if (!text) return prompt();

      if (text === '/exit') {
        console.log('Bye!');
        return rl.close();
      }

      if (text === '/help') {
        showHelp();
        return prompt();
      }

      if (text === '/new') {
        client.newConversation();
        console.log('Started new conversation.\n');
        return prompt();
      }

      if (text === '/stream') {
        streaming = !streaming;
        console.log(`Streaming: ${streaming ? 'ON' : 'OFF'}\n`);
        return prompt();
      }

      if (text === '/context') {
        console.log(`Context ID: ${client.getContextId() || '(none)'}\n`);
        return prompt();
      }

      try {
        if (streaming) {
          process.stdout.write('Agent: ');
          for await (const chunk of client.stream(text)) {
            process.stdout.write(chunk);
          }
          console.log('\n');
        } else {
          const task = await client.send(text);
          const response = task.messages.find(m => m.role === 'agent');
          console.log(`Agent: ${response?.parts[0].text || '(no response)'}\n`);
        }
      } catch (error: unknown) {
        if (error instanceof PaymentRequiredError) {
          console.log(`[402] Payment required\n`);
        } else if (error instanceof Error) {
          console.log(`Error: ${error.message}\n`);
        }
      }

      prompt();
    });
  };

  prompt();
}

async function testCommand(client: A2AClient) {
  console.log(`\nA2A Test Suite\n`);
  console.log('-'.repeat(50));

  const tests = [
    {
      name: 'Agent Discovery',
      fn: async () => {
        const card = await client.discover();
        if (!card.name) throw new Error('Missing name');
        if (!card.skills?.length) throw new Error('No skills defined');
      },
    },
    {
      name: 'Simple Message',
      fn: async () => {
        client.newConversation();
        const task = await client.send('Hello');
        if (task.status !== 'completed') throw new Error(`Status: ${task.status}`);
        if (!task.messages.some(m => m.role === 'agent')) throw new Error('No response');
      },
    },
    {
      name: 'Multi-turn Conversation',
      fn: async () => {
        client.newConversation();
        const task1 = await client.send('My name is TestUser');
        const contextId = task1.contextId;

        const task2 = await client.continue('What is my name?');
        if (task2.contextId !== contextId) throw new Error('Context ID changed');
      },
    },
    {
      name: 'Context Isolation',
      fn: async () => {
        client.newConversation();
        await client.send('Remember: secret=42');
        const ctx1 = client.getContextId();

        client.newConversation();
        const task = await client.send('What is the secret?');

        if (task.contextId === ctx1) throw new Error('Context not isolated');
      },
    },
    {
      name: 'Streaming Response',
      fn: async () => {
        // Check if agent supports streaming
        const card = await client.discover();
        if (!card.capabilities.streaming) {
          // Skip test if streaming not supported (not a failure)
          console.log('       (skipped - streaming not enabled)');
          return;
        }

        client.newConversation();
        let chunks = 0;
        for await (const chunk of client.stream('Say hello')) {
          chunks++;
          if (chunks > 100) break; // Safety limit
        }
        if (chunks === 0) throw new Error('No streaming chunks received');
      },
    },
  ];

  let passed = 0;

  for (const test of tests) {
    const start = Date.now();
    try {
      await test.fn();
      console.log(`[PASS] ${test.name} (${Date.now() - start}ms)`);
      passed++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${test.name}`);
      console.log(`       ${message}`);
    }
  }

  console.log('-'.repeat(50));
  console.log(`\n${passed}/${tests.length} tests passed`);

  if (passed < tests.length) {
    process.exit(1);
  }
}

async function demoCommand(client: A2AClient) {
  console.log('\n=== A2A Client Demo ===\n');

  // 1. Discovery
  console.log('1. Discovering agent...');
  const card = await client.discover();
  console.log(`   Found: ${card.name}\n`);

  // 2. Simple message
  console.log('2. Sending simple message...');
  client.newConversation();
  const task1 = await client.send('Hello! What can you do?');
  const response1 = task1.messages.find(m => m.role === 'agent');
  console.log(`   Agent: ${response1?.parts[0].text.substring(0, 100)}...\n`);

  // 3. Multi-turn
  console.log('3. Testing multi-turn conversation...');
  const task2 = await client.continue('Tell me more about your first skill.');
  const response2 = task2.messages.find(m => m.role === 'agent');
  console.log(`   Agent: ${response2?.parts[0].text.substring(0, 100)}...\n`);

  console.log('=== Demo Complete ===\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const serverUrl = process.env.A2A_SERVER_URL || 'http://localhost:3000';
  const client = new A2AClient(serverUrl);

  console.log(`A2A Client - Target: ${serverUrl}`);

  const args = process.argv.slice(2);

  try {
    if (args.includes('--discover') || args.includes('-d')) {
      await discoverCommand(client);
    } else if (args.includes('--interactive') || args.includes('-i')) {
      await chatCommand(client);
    } else if (args.includes('--test') || args.includes('-t')) {
      await testCommand(client);
    } else {
      await demoCommand(client);
    }
  } catch (error: unknown) {
    if (error instanceof PaymentRequiredError) {
      console.error('\nError: Payment required (402)');
      console.error('The A2A endpoint requires x402 payment.');
    } else if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    }
    process.exit(1);
  }
}

main();

// ============================================================================
// Exports (for programmatic use)
// ============================================================================

export { A2AClient, PaymentRequiredError };
export type { AgentCard, Task, JsonRpcResponse };
