import { AtSymbolLinkingSettings } from "src/settings/settings";
import { syntaxTree } from "@codemirror/language";

/**
 * Checks if a code block type is allowed for @ symbol linking
 * @param state - The CodeMirror state
 * @param node - The syntax tree node representing the code block
 * @param settings - The plugin settings containing allowed code block types
 * @returns true if the code block type is allowed, false otherwise
 */
export function isAllowedCodeBlockType(
	state: any,
	node: any,
	settings: AtSymbolLinkingSettings
): boolean {
	// If no allowed types are configured, disallow all code blocks
	if (settings.allowedCodeBlockTypes.length === 0) {
		return false;
	}

	try {
		// The node we have is just the content, we need to find the code block start
		// Let's look backwards from the current node to find the opening ```
		let codeBlockType = "";
		
		// Try to find the code block header by looking at the document around the code block
		// We'll search backwards from the node start to find the ``` line
		const searchStart = Math.max(0, node.from - 200); // Look back up to 200 chars
		const contextText = state.doc.sliceString(searchStart, node.from);
		
		// Find the last ``` line before our node
		const lines = contextText.split('\n');
		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i].trim();
			if (line.startsWith('```')) {
				// Extract language after the backticks
				const langMatch = line.match(/^```\s*(.*)$/);
				if (langMatch) {
					codeBlockType = langMatch[1].trim();
					break;
				}
			}
		}
		
		if (!codeBlockType) {
			return false;
		}
		
		// Check if this type is in our allowed list
		return settings.allowedCodeBlockTypes.includes(codeBlockType);
	} catch (error) {
		// If we can't parse the code block type, err on the side of caution
		return false;
	}
}

/**
 * Checks if the cursor is in a disallowed code block context
 * @param editor - The editor instance (can be Obsidian Editor or CodeMirror view)
 * @param settings - The plugin settings
 * @param isPopupOpen - Whether the suggestion popup is currently open
 * @returns true if in a disallowed code block, false otherwise
 */
export function isInDisallowedCodeBlock(
	editor: any,
	settings: AtSymbolLinkingSettings,
	isPopupOpen: boolean = false
): boolean {
	let isInDisallowedCodeBlock = false;
	
	// Handle both native Obsidian Editor and CodeMirror view types
	const cm = editor?.cm || editor;
	
	if (cm?.state) {
		const cursor = cm.state?.selection?.main as {
			from: number;
			to: number;
		};
		
		if (!cursor) {
			return false;
		}

		syntaxTree(cm.state).iterate({
			from: cursor.from,
			to: cursor.to,
			enter: (node: any) => {
				if (node.type.name === "inline-code") {
					// Inline code is always disallowed
					isInDisallowedCodeBlock = true;
				} else if (node.type.name?.includes("codeblock")) {
					// For code blocks, check if the type is in the allowed list
					const isAllowedType = isAllowedCodeBlockType(
						cm.state,
						node,
						settings
					);
					if (!isAllowedType) {
						isInDisallowedCodeBlock = true;
					}
				}
			},
		});
	}

	// If already open, allow backticks to be part of file name
	return isInDisallowedCodeBlock && !isPopupOpen;
}