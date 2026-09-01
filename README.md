# TICKR: Autonomous Financial Research Agent

An institutional-grade autonomous financial research agent that gathers official SEC filings, extracts audited XBRL financial statements, computes forensic quantitative ratios, and synthesizes interactive stock reports with audio briefings.

## Features

- **Official SEC EDGAR Integration**: Retrieves authentic 10-K and 10-Q filings, filing dates, and accession records.
- **Forensic Quantitative Modeler**: Computes Piotroski F-Score (0–9), Altman Z-Score, net margins, and YoY growth.
- **4-Agent Adversarial Committee**: Forensic Auditor, Long Portfolio Manager, Short Seller, and CIO Judge.
- **Interactive Dashboard**: Real-time reasoning timeline, Recharts financial visualizers, and dual-speaker podcast briefing.

## Getting Started

### Prerequisites
- Node.js (v18+)
- OpenRouter API key

### Installation & Run

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure your API key in `.env.local`:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   PORT=3000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.
