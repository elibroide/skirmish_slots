const fs = require('fs');
const path = require('path');

// Paths
const CARDS_SOURCE = path.resolve(__dirname, '../src/data/cards.json');
const OUTPUT_DIR = path.resolve(__dirname, '../src/data/cards');

// Ensure output directory
if (!fs.existsSync(OUTPUT_DIR))
{
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ----------------------------------------------------------------------------
// TRAIT EXTRACTION LOGIC
// ----------------------------------------------------------------------------

function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<[^>]+>/g, '')      // Remove tabs
        .replace(/&nbsp;/g, ' ')      // Replace non-breaking spaces
        .replace(/\s+/g, ' ')         // Collapse whitespace
        .trim();
}

function parseEffectSentence(sentence) {
    const lower = sentence.toLowerCase();

    // 1. DEAL DAMAGE
    // "Deal X damage to..."
    const damageMatch = lower.match(/deal\s+(\d+)\s+damage/);
    if (damageMatch)
    {
        return {
            effect: "DEAL_DAMAGE",
            value: parseInt(damageMatch[1]),
            target: parseTarget(lower), // Heuristic target
            targetDecision: "PLAYER"
        };
    }

    // 2. BUFF / MODIFY SLOT
    // "Modify (my/close) slot by +X"
    if (lower.includes('modify') && lower.includes('slot'))
    {
        const valMatch = lower.match(/([+-]?\d+)/);
        if (valMatch)
        {
            return {
                effect: "ADD_SLOT_MODIFIER",
                value: parseInt(valMatch[0]), // Capture sign
                target: lower.includes('my slot') ? "SELF" : "SLOT" // "SLOT" usually implies close slot if not specified? 
                // Actually "modify close ally slot" -> Target SLOT.
            };
        }
    }

    // "Get +X power" / "have +X power"
    if ((lower.includes('get') || lower.includes('have')) && lower.includes('power'))
    {
        const valMatch = lower.match(/([+-]?\d+)/);
        if (valMatch)
        {
            return {
                effect: "ADD_POWER",
                value: parseInt(valMatch[0]),
                target: "SELF"
            };
        }
    }

    // 3. DRAW CARDS
    if (lower.includes('draw'))
    {
        const valMatch = lower.match(/draw\s+(\d+|a)\s+card/);
        const val = valMatch ? (valMatch[1] === 'a' ? 1 : parseInt(valMatch[1])) : 1;
        return {
            effect: "DRAW_CARDS",
            value: val
        };
    }

    // 4. SHIELD
    if (lower.includes('shield'))
    {
        const valMatch = lower.match(/([+-]?\d+)\s+shield/);
        if (valMatch)
        {
            return {
                effect: "ADD_SHIELD",
                value: parseInt(valMatch[1]),
                target: lower.includes('close') ? "CLOSE_ALLY" : "SELF"
            };
        }
    }

    // 5. NULLIFY
    if (lower.includes('nullify'))
    {
        return {
            effect: "NULLIFY",
            value: 0,
            target: parseTarget(lower) || "CLOSE_UNIT"
        };
    }

    // 6. BOUNCE
    if (lower.includes('bounce'))
    {
        return {
            effect: "BOUNCE",
            value: 0,
            target: parseTarget(lower) || "CLOSE_UNIT"
        };
    }

    // 7. MOVE
    if (lower.includes('move'))
    {
        return {
            effect: "MOVE",
            value: 0, // Destination determined by context usually
            target: lower.includes('me') || lower.includes('i ') ? "SELF" : "CLOSE_UNIT"
        };
    }

    // 8. CREATE
    if (lower.includes('create'))
    {
        return {
            effect: "CREATE_CARD", // Generic create
            value: "random_card" // Placeholder
        };
    }

    return null;
}

function parseTarget(text) {
    if (text.includes('close enemy')) return "CLOSE_ENEMY";
    if (text.includes('close ally')) return "CLOSE_ALLY";
    if (text.includes('close unit')) return "CLOSE_UNIT";
    if (text.includes('opposing')) return "OPPOSING_UNIT";
    if (text.includes('self') || text.includes(' me ') || text.includes(' i ')) return "SELF";
    return null;
}


function extractTraitsFromText(htmlText) {
    const plain = stripHtml(htmlText);
    const sentences = plain.split(/[.?!]\s*/); // Split by punctuation
    const traits = [];

    // Helper to add
    const addTrait = (trigger, effectConfig) => {
        if (!effectConfig) return;
        traits.push({
            type: "reaction",
            config: {
                trigger: trigger,
                ...effectConfig
            }
        });
    };

    sentences.forEach(s => {
        const lower = s.toLowerCase();

        // 1. DEPLOY
        if (lower.startsWith('deploy:') || lower.includes('deploy:'))
        {
            const content = s.split(/deploy:/i)[1].trim();
            const effect = parseEffectSentence(content);
            if (effect) addTrait("ON_DEPLOY", effect);
        }

        // 2. DEATH / DISMANTLED
        else if (lower.startsWith('death:') || lower.startsWith('dismantled:') || lower.includes('dismantled:'))
        {
            const content = s.split(/death:|dismantled:/i)[1].trim();
            const effect = parseEffectSentence(content);
            if (effect) addTrait("ON_DEATH", effect);
        }

        // 3. ACTIVATE
        else if (lower.startsWith('activate'))
        {
            // Complex handling usually, but let's try basic
            // Actiavte (Cooldown X): Effect
            // Can't easily map to "Reaction", usually its own type "activate"
            // We'll skip adding incorrect reactions for Activates
            // But if user wants to see *something*, we'll leave it empty for manual fill
        }

        // 4. CONSUME (Trigger)
        else if (lower.startsWith('consume:'))
        {
            const content = s.split(/consume:/i)[1].trim();
            const effect = parseEffectSentence(content);
            if (effect) addTrait("ON_CONSUME", effect); // Consuming
        }
    });

    return traits;
}

// ----------------------------------------------------------------------------
// MAIN EXECUTION
// ----------------------------------------------------------------------------

console.log(`Reading cards from ${CARDS_SOURCE}...`);
let cardsData;
try
{
    const raw = fs.readFileSync(CARDS_SOURCE, 'utf8');
    cardsData = JSON.parse(raw).cards;
} catch (e)
{
    console.error("Failed to read cards.json:", e);
    process.exit(1);
}

let count = 0;
const indexExports = [];

cardsData.forEach(card => {
    if (!card.data || !card.data.name) return;

    // 1. Slugify
    const slug = card.data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '_');

    // 2. Text Processing
    const plainText = stripHtml(card.data.text || "");

    // 3. Trait Extraction
    let traits = [];
    try
    {
        traits = extractTraitsFromText(card.data.text || "");
    } catch (e)
    {
        console.warn(`Error extracting traits for ${slug}:`, e);
    }

    // 4. Construct Output Object
    const cardOutput = {
        id: slug,
        originalId: card.id,
        name: card.data.name,
        description: plainText, // Use plain text as main description? Or keep html?
        // User asked for "add plainText", implying distinct field.
        plainText: plainText,   // Explicitly requested
        text: card.data.text,   // Keep original HTML just in case

        basePower: parseInt(card.data.power) || 0,
        rarity: card.data.rarity,
        color: card.data.color,
        unitType: card.data.type,

        traits: traits || []
    };

    // 5. Write File
    const filePath = path.join(OUTPUT_DIR, `${slug}.json`);

    // Check if we should overwrite?
    // User deleted files -> Overwrite is fine.
    // If user edited files manually, we'd want to merge.
    // Assuming fresh start based on request "create integration cjs... create all files".

    fs.writeFileSync(filePath, JSON.stringify(cardOutput, null, 2));
    console.log(`Generated packages/engine/src/data/cards/${slug}.json`);

    indexExports.push(`export { default as ${slug} } from './${slug}.json';`);
    count++;
});

// 6. optional: Generate Index (for convenience, but user deleted it before)
// We will generate it but not link it to definitions.
const indexPath = path.join(OUTPUT_DIR, 'index.ts');
const indexContent = indexExports.join('\n') + `\n\nexport const integratedCards = [\n  ${indexExports.map(e => e.match(/as (\w+)/)[1]).join(',\n  ')}\n];\n`;

fs.writeFileSync(indexPath, indexContent);
console.log(`Generated index.ts`);

console.log(`\nSuccess! Processed ${count} cards.`);
