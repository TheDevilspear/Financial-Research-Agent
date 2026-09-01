# TICKR Overview: Multi-Agent Financial Research System

## Core Architecture and Logic

TICKR operates as a dynamic, agentic research committee, moving beyond monolithic, single-pass LLM queries to distribute complex financial intelligence gathering and synthesis tasks. It leverages an adversarial multi-agent configuration to deliver institutional-grade research.

The logic flows across four sequential tiers of orchestration:

1. **Tier 1 (Data Gathering & Official Ingestion)**: Ingests official SEC EDGAR 10-K/10-Q filings, XBRL audited financial statements, and 4-month market history in parallel.
2. **Tier 2 (Forensic Quantitative Engine)**: Calculates institutional financial ratios (Piotroski F-Score, Altman Z-Score, net profit margins, YoY revenue trends).
3. **Tier 3 (Adversarial Committee & Synthesis)**: Forensic Auditor, Long Portfolio Manager, and Short Seller debate the bull and bear theses, and the Chief Investment Officer structures the findings into a strict JSON schema (`ReportData`).
4. **Tier 4 (Media Production)**: Converts the resulting debate script into a multi-speaker audio podcast briefing, streaming audio directly to the user interface.

The orchestration happens within a Node.js/Express server that constructs the context for the agent, commands the simulation of this multi-agent process, and streams the execution live to the React frontend.
