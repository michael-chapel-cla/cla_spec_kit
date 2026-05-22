# System Architecture — LiquidityEventOS

## Layers
1. Equity and document ingestion
2. Deterministic equity-tax rules engine
3. Scenario engine for sale/tender/IPO/exercise paths
4. Action workflow engine
5. AI explanation layer
6. Collaboration layer for advisor/CPA/legal coordination

## Principle
LLMs should not invent tax conclusions. They should present structured scenario outputs from a versioned rules engine.
