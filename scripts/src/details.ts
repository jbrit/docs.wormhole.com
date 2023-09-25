import * as cfg from "./config";
import { fmtNum, fmtStr } from "./util";

const SRC_BASE = "https://github.com/wormhole-foundation/wormhole/blob/main/";

export function contractTable(contracts: cfg.Contracts): string {
  let core = `|Type|Contract|
|----|--------|
|Core|${fmtStr(contracts.core)}|
|Token Bridge|${fmtStr(contracts.token_bridge)}|
|NFT Bridge|${fmtStr(contracts.nft_bridge)}|`;

  if (contracts.wormholeRelayerAddress !== undefined) {
    core += `\n|Relayer|${fmtStr(contracts.wormholeRelayerAddress)}|`;
    if (contracts.mockDeliveryProviderAddress)
      core += `\n|MockProvider|${fmtStr(
        contracts.mockDeliveryProviderAddress
      )}|`;
    if (contracts.mockIntegrationAddress)
      core += `\n|MockIntegration|${fmtStr(contracts.mockIntegrationAddress)}|`;
  }

  if (contracts.cctp !== undefined) {
    core += `\n|CCTP|${fmtStr(contracts.cctp)}|`;
  }

  return core;
}

export function finalityOptionTable(
  finality: cfg.Finality | undefined
): [string, string] {
  let finalityOptions = "";
  let finalityDetails = "";

  if (finality === undefined) return [finalityOptions, finalityDetails];

  const { confirmed, finalized, instant, safe, otherwise, details } = finality;

  if (details !== undefined) {
    finalityDetails = `\nFor more information see [${details}](${details})\n`;
  }

  let otherwiseText = "";
  if (otherwise) {
    otherwiseText = `\nIf a value is passed that is _not_ in the set above it's assumed to mean ${otherwise}`;
  }

  let settingTexts = {
    Confirmed: fmtNum(confirmed),
    Instant: fmtNum(instant),
    Safe: fmtNum(safe),
    Finalized: fmtNum(finalized),
  };

  if (finalized === 0) {
    otherwiseText += `\n\nThis field is may be ignored since the chain provides instant finality.`;
  }

  finalityOptions = `|Level|Value|\n|-----|-----|`;
  for (const [level, value] of Object.entries(settingTexts)) {
    if (value !== " ") finalityOptions += `\n|${level}|${value}|`;
  }

  finalityOptions += otherwiseText;

  return [finalityOptions, finalityDetails];
}

export function chainDetailsPage(chain: cfg.DocChain): string {
  const { name, id, extraDetails } = chain;
  const { mainnet, testnet, devnet } = chain;

  const updateLink = `https://github.com/wormhole-foundation/docs.wormhole.com/blob/main/scripts/src/chains/${name}.json`;

  let webpage = `No webpage, update [here](${updateLink})`;
  let explorerLinks = `No explorer, update [here](${updateLink})`;
  let devdocs = `No dev docs, update [here](${updateLink})`;
  let src = `No source file, update [here](${updateLink})`;

  let noteHints = "";

  const [finalityOptions, finalityDetails] = finalityOptionTable(
    extraDetails?.finality
  );

  let title = extraDetails?.title || name;

  if (extraDetails !== undefined) {
    const { contractSource, homepage, explorer, finality, notes } =
      extraDetails;

    if (notes !== undefined) {
      noteHints = `\n${notes
        .map((n) => {
          return `{% hint style='info' %}\n${n}\n{% endhint %}`;
        })
        .join("\n")}\n`;
    }

    if (contractSource !== undefined) {
      src = `[${contractSource}](${SRC_BASE}${contractSource})`;
    }

    if (homepage !== undefined) {
      webpage = `[Web site](${homepage})`;
    }

    if (explorer !== undefined) {
      const explorers = [];
      for (const exp of explorer) {
        explorers.push(
          `[${exp.description ? exp.description : exp.url}](${exp.url})`
        );
      }
      explorerLinks = explorers.join(" | ");
    }

    if (extraDetails.developer !== undefined) {
      const docs = [];
      for (const dd of extraDetails.developer) {
        docs.push(`[${dd.description ? dd.description : dd.url}](${dd.url})`);
      }
      devdocs = docs.join(" | ");
    }
  }

  return `
# ${title}
${noteHints}
## Ecosystem

- ${webpage}
- ${explorerLinks}
- ${devdocs}

## Wormhole Details

- **Name**: \`${name}\`
- **Chain ID**: \`${id}\`
- **Contract Source**: ${src}

${
  finalityOptions === ""
    ? ""
    : `### Consistency Levels

The options for [consistencyLevel](../../components/core-contracts.md#consistencylevel) (i.e finality) are:`
}

${finalityOptions}

${finalityDetails}

### Mainnet Contracts

${contractTable(mainnet)}

### Testnet Contracts

${contractTable(testnet)}

### Devnet Contract

${contractTable(devnet)}
  
`;
}

export function generateAllChainIdsTable(dc: cfg.DocChain[]): string {
  let table: string[] = [
    `|Chain Name|Wormhole Chain Id|`,
    `|---|------------|`,
  ];

  const orderedDc = dc.sort((a, b) => {
    return a.id - b.id;
  });

  for (const c of orderedDc) {
    table.push(`|${c.name}|${c.id}|`);
  }

  return table.join("\n") + "\n";
}

export function generateAllConsistencyLevelsTable(dc: cfg.DocChain[]): string {
  const orderedDc = dc.sort((a, b) => {
    return a.id - b.id;
  });

  let content: string[] = [];

  for (const c of orderedDc) {
    if (c.extraDetails?.finality === undefined) continue;

    const f = c.extraDetails.finality;

    const header = c.extraDetails.title ? c.extraDetails.title : c.name;

    const [opts, deets] = finalityOptionTable(f);

    content.push(`## ${header}`, opts, deets);
  }

  return content.join("\n");
}

export function generateAllContractsTable(
  dc: cfg.DocChain[],
  module: string
): string {
  let table: string[] = [
    `|Chain Name|Mainnet|Testnet|Devnet|`,
    `|---|---|---|---|`,
  ];

  const orderedDc = dc.sort((a, b) => {
    return a.id - b.id;
  });

  for (const c of orderedDc) {
    switch (module) {
      case "core":
        table.push(
          `|${c.name}|` +
            `${fmtStr(c.mainnet.core)}|` +
            `${fmtStr(c.testnet.core)}|` +
            `${fmtStr(c.devnet.core)}|`
        );
        continue;
      case "token_bridge":
        table.push(
          `|${c.name}|` +
            `${fmtStr(c.mainnet.token_bridge)}|` +
            `${fmtStr(c.testnet.token_bridge)}|` +
            `${fmtStr(c.devnet.token_bridge)}|`
        );
        continue;
      case "nft_bridge":
        table.push(
          `|${c.name}|` +
            `${fmtStr(c.mainnet.nft_bridge)}|` +
            `${fmtStr(c.testnet.nft_bridge)}|` +
            `${fmtStr(c.devnet.nft_bridge)}|`
        );
        continue;
      case "cctp":
        table.push(
          `|${c.name}|` +
            `${fmtStr(c.mainnet.cctp)}|` +
            `${fmtStr(c.testnet.cctp)}|` +
            `${fmtStr(c.devnet.cctp)}|`
        );
        continue;
      case "relayer":
        table.push(
          `|${c.name}|` +
            `${fmtStr(c.mainnet.wormholeRelayerAddress)}|` +
            `${fmtStr(c.testnet.wormholeRelayerAddress)}|` +
            `${fmtStr(c.devnet.wormholeRelayerAddress)}|`
        );
        continue;
    }
  }

  return table.join("\n") + "\n";
}
