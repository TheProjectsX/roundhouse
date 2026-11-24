import type {
    OpenAIChatTool,
    OpenAIChatToolCall,
} from "@/core/models/types";

export type RescuedToolCallsResult = {
    content: string;
    toolCalls?: OpenAIChatToolCall[];
    rescued: boolean;
};

const TOOL_CALL_TAG_RE =
    /<(?:tool_call|function_call)>\s*([\s\S]*?)\s*<\/(?:tool_call|function_call)>/gi;

const FENCED_JSON_RE = /```(?:json)?\s*([\s\S]*?)\s*```/gi;

const tryParseToolPayload = (
    raw: string,
    allowedNames: Set<string>,
    index: number,
): OpenAIChatToolCall | null => {
    try {
        const parsed = JSON.parse(raw.trim()) as {
            name?: unknown;
            arguments?: unknown;
            input?: unknown;
            parameters?: unknown;
        };
        if (
            !parsed ||
            typeof parsed !== "object" ||
            typeof parsed.name !== "string" ||
            !allowedNames.has(parsed.name)
        ) {
            return null;
        }

        const argsObj =
            parsed.arguments ?? parsed.input ?? parsed.parameters ?? {};
        const argsString =
            typeof argsObj === "string" ? argsObj : JSON.stringify(argsObj);

        return {
            id: `call_rescued_${Date.now()}_${index}`,
            type: "function",
            function: {
                name: parsed.name,
                arguments: argsString,
            },
        };
    } catch {
        return null;
    }
};

export const rescueInlineToolCalls = (
    content: string,
    tools?: OpenAIChatTool[],
): RescuedToolCallsResult => {
    if (!content || !tools || tools.length === 0) {
        return { content, rescued: false };
    }

    const allowedNames = new Set(tools.map((t) => t.function.name));
    const rescuedCalls: OpenAIChatToolCall[] = [];
    let remaining = content;

    remaining = remaining.replace(TOOL_CALL_TAG_RE, (fullMatch, inner) => {
        const call = tryParseToolPayload(
            String(inner),
            allowedNames,
            rescuedCalls.length,
        );
        if (call) {
            rescuedCalls.push(call);
            return "";
        }
        return fullMatch;
    });

    if (rescuedCalls.length === 0) {
        remaining = remaining.replace(FENCED_JSON_RE, (fullMatch, inner) => {
            const call = tryParseToolPayload(
                String(inner),
                allowedNames,
                rescuedCalls.length,
            );
            if (call) {
                rescuedCalls.push(call);
                return "";
            }
            return fullMatch;
        });
    }

    if (rescuedCalls.length === 0 && content.trim().startsWith("{")) {
        const call = tryParseToolPayload(content, allowedNames, 0);
        if (call) {
            rescuedCalls.push(call);
            remaining = "";
        }
    }

    if (rescuedCalls.length === 0) {
        return { content, rescued: false };
    }

    return {
        content: remaining.trim(),
        toolCalls: rescuedCalls,
        rescued: true,
    };
};
