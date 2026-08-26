#!/usr/bin/env node
/**
 * Standalone MCP server: lets AI agents (e.g. Claude) create, list, and
 * analyze comment-to-DM automations. Runs as its own HTTP process,
 * separate from the Next.js app, on MCP_SERVER_PORT.
 *
 * Every request must carry `Authorization: Bearer <token>` — validated by
 * lib/mcp/auth.ts before any tool executes. A new McpServer instance is
 * created per request (stateless mode) so each one is bound to the
 * requesting token's resolved userId; there is no way for a tool call to
 * act on a different user's data.
 */
import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { McpAuthError, resolveMcpAuthContext } from '@/lib/mcp/auth';
import {
  McpToolError,
  createAutomationTool,
  getAutomationStatsInputSchema,
  getAutomationStatsTool,
  listAutomationsTool,
} from '@/lib/mcp/tools';
import { platformSchema, matchTypeSchema } from '@/lib/automation/validation';
import { logger } from '@/lib/security/logger';

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) }], isError: true };
}

function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: 'meta-comment-dm-engine',
    version: '0.1.0',
  });

  server.registerTool(
    'create_automation',
    {
      title: 'Create automation',
      description:
        'Creates a comment-to-DM automation for the authenticated user. Attaches it to the user\'s most ' +
        'recently connected account for the given platform — fails if no such account is connected.',
      inputSchema: {
        keyword: z.string().min(1).max(500),
        replyMessage: z.string().min(1).max(1000),
        linkUrl: z.string().url().optional(),
        platform: platformSchema,
        matchType: matchTypeSchema,
      },
    },
    async (args) => {
      try {
        const automation = await createAutomationTool(userId, args);
        return textResult(automation);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Failed to create automation.');
      }
    },
  );

  server.registerTool(
    'list_automations',
    {
      title: 'List automations',
      description:
        "Lists the authenticated user's automations with keyword, platform, active status, reply " +
        'message, and trigger/success/failure counts.',
      inputSchema: {},
    },
    async () => {
      try {
        const automations = await listAutomationsTool(userId);
        return textResult(automations);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Failed to list automations.');
      }
    },
  );

  server.registerTool(
    'get_automation_stats',
    {
      title: 'Get automation stats',
      description:
        'Returns total triggers, successful/failed DMs, success rate, top keywords, and recent logs for one ' +
        "automation owned by the authenticated user. Conversion tracking is explicitly reported as " +
        'unavailable — this system does not yet track recipient behavior after a DM is sent.',
      inputSchema: getAutomationStatsInputSchema.shape,
    },
    async (args) => {
      try {
        const stats = await getAutomationStatsTool(userId, args);
        return textResult(stats);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Failed to fetch automation stats.');
      }
    },
  );

  return server;
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  let authContext;
  try {
    authContext = await resolveMcpAuthContext(req.headers.authorization);
  } catch (error) {
    if (error instanceof McpAuthError) {
      logger.warn('mcp_auth_rejected', { message: error.message });
      res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: error.message }));
      return;
    }
    throw error;
  }

  const server = buildMcpServer(authContext.userId);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res);
}

function main() {
  const port = Number(process.env.MCP_SERVER_PORT) || 3001;

  if (!process.env.MCP_AUTH_TOKEN) {
    logger.warn('mcp_server_starting_without_auth_token', {
      note: 'MCP_AUTH_TOKEN is not set — no requests will be authorizable until it (and MCP_AUTH_USER_EMAIL) are configured, unless per-user McpApiKey rows exist.',
    });
  }

  const httpServer = createServer((req, res) => {
    handleMcpRequest(req, res).catch((error) => {
      logger.error('mcp_request_failed', { message: error instanceof Error ? error.message : String(error) });
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Internal server error.' }));
      }
    });
  });

  httpServer.listen(port, () => {
    logger.info('mcp_server_listening', { port });
  });
}

main();
