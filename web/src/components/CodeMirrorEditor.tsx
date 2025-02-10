"use client";

import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import { EditorView, basicSetup } from "codemirror";

// type  for the editor handle to expose methods
export type CodeMirrorHandle = {
	getValue: () => string;
};

type CodeMirrorEditorProps = {
	editorRef?: React.RefObject<CodeMirrorHandle | null>;
};
const CodeMirrorEditor = ({ editorRef }: CodeMirrorEditorProps) => {
	//ref for container div to mount the editor
	const containerRef = useRef<HTMLDivElement>(null);

	// holds the editors user interface instance
	const viewRef = useRef<EditorView>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const startState = EditorState.create({
			doc: "create Table users(id int, name varchar(255));\ninsert into users values(1, 'test_user');\nselect * from users;",
			extensions: [
				basicSetup, // key bindings and line numbers
				sql(), //sql lang
				EditorView.theme({
					"&": { height: "691px", fontSize: "14px" }, //editor styles
					"cm-contet": { fontFamily: "monospace" }, //for editor content
				}),
			],
		});

		// Create a new EditorView instance with the initial state and attach it to the container
		const view = new EditorView({
			state: startState,
			parent: containerRef.current,
		});

		viewRef.current = view; //store the view instance in ref

		if (editorRef) {
			editorRef.current = {
				getValue: () => view.state.doc.toString(),
			};
		}

		// Cleanup function to destroy the editor view when the component unmounts or updates
		return () => {
			view.destroy();
		};
	}, []);

	return <div ref={containerRef} />; // Render a div that will contain the CodeMirror editor
};

export default CodeMirrorEditor;
