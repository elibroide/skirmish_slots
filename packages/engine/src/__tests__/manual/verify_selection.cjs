"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var GameEngine_1 = require("../../core/GameEngine");
var Card_1 = require("../../mechanics/cards/Card");
var ReactionTrait_1 = require("../../mechanics/core/traits/ReactionTrait");
// Mock Controller
var MockController = /** @class */ (function () {
    function MockController(playerId, type) {
        this.playerId = playerId;
        this.type = type;
    }
    MockController.prototype.onEvent = function (event) { };
    MockController.prototype.onRequestAction = function (request) { };
    return MockController;
}());
function runTest() {
    return __awaiter(this, void 0, void 0, function () {
        var p1, p2, engine, hero, enemy1, enemy2, reactionTrait, selectionRequested;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- Starting Async Selection Verification ---');
                    p1 = new MockController(0, 'human');
                    p2 = new MockController(1, 'human');
                    engine = new GameEngine_1.GameEngine(p1, p2, { seed: 12345 });
                    return [4 /*yield*/, engine.initializeGame([], [])];
                case 1:
                    _a.sent();
                    hero = new Card_1.UnitCard('hero', 'Hero', 'Deals Logic', 10, 0, engine);
                    return [4 /*yield*/, hero.deploy(0)];
                case 2:
                    _a.sent(); // Slot 0,0
                    enemy1 = new Card_1.UnitCard('e1', 'Enemy 1', '-', 10, 0, engine);
                    enemy2 = new Card_1.UnitCard('e2', 'Enemy 2', '-', 10, 0, engine);
                    return [4 /*yield*/, enemy1.deploy(1)];
                case 3:
                    _a.sent(); // Slot 0,1 (Opposing)
                    return [4 /*yield*/, enemy2.deploy(1)];
                case 4:
                    _a.sent();
                    reactionTrait = new ReactionTrait_1.ReactionTrait(hero, {
                        triggers: [{ type: 'ManualTest' }],
                        effects: [{
                                type: 'BuffPower', // Simple effect
                                target: {
                                    type: 'Relative',
                                    proximity: 'All',
                                    relationship: 'Enemy',
                                    multipleChoice: 'Player' // <--- KEY
                                },
                                value: { type: 'static', value: -5 } // Debuff
                            }]
                    });
                    hero.addTrait(reactionTrait);
                    selectionRequested = false;
                    hero.requestInput = function (req) { return __awaiter(_this, void 0, void 0, function () {
                        var target;
                        return __generator(this, function (_a) {
                            console.log('MOCK: requestInput called with', req.type);
                            selectionRequested = true;
                            if (req.type === 'select_target') {
                                console.log("MOCK: Candidates found: ".concat(req.candidates.length));
                                target = req.candidates.find(function (c) { return c.id === 'e2'; });
                                return [2 /*return*/, [target]];
                            }
                            return [2 /*return*/, []];
                        });
                    }); };
                    // 5. Trigger Reaction
                    // We use TriggerManager usually, but here we can call handleTrigger via private access hack or just Simulate Event?
                    // Let's us simulate via emitEvent if TriggerManager was hooked up?
                    // Manual trigger via handleTrigger is easier for unit test.
                    // reactionTrait['handleTrigger']({ type: 'ManualTest' }, {});
                    // TriggerManager listens to events.
                    // We registered 'ManualTest' trigger.
                    // So emitting event 'ManualTest' should work IF TriggerManager supports custom string triggers.
                    // ReactTypes: TriggerType = ... | string. Yes. triggerMatcher matches type.
                    console.log('Emitting ManualTest event...');
                    // Using engine to emit event, which TriggerManager hears.
                    // TriggerManager checks: event.type === 'ManualTest'.
                    // We need to assert context. 
                    // TriggerMatcher usually filters by cardType or ID?
                    // If no filters in TriggerConfig, it matches ANY 'ManualTest' event?
                    // TriggerManager listens to ALL events? Yes.
                    // But wait, the async stack means we need to process the stack.
                    // engine.emitEvent -> triggerManager -> handleTrigger -> creates TriggerEffect -> engine.addInterrupt.
                    // processEffectStack() needs to run.
                    return [4 /*yield*/, engine.emitEvent({ type: 'ManualTest', playerId: 0 })];
                case 5:
                    // Using engine to emit event, which TriggerManager hears.
                    // TriggerManager checks: event.type === 'ManualTest'.
                    // We need to assert context. 
                    // TriggerMatcher usually filters by cardType or ID?
                    // If no filters in TriggerConfig, it matches ANY 'ManualTest' event?
                    // TriggerManager listens to ALL events? Yes.
                    // But wait, the async stack means we need to process the stack.
                    // engine.emitEvent -> triggerManager -> handleTrigger -> creates TriggerEffect -> engine.addInterrupt.
                    // processEffectStack() needs to run.
                    _a.sent();
                    // At this point, the TriggerEffect should be in the stack (or processing if we didn't await processEffectStack?).
                    // engine.emitEvent usually awaits processEffectStack() at the end?
                    // In GameEngine.ts: emitEvent() pushes to event history, notifies listeners.
                    // Listeners (TriggerManager) run synchronous?
                    // TriggerManager.onEvent calls handleTrigger.
                    // handleTrigger calls engine.addInterrupt().
                    // addInterrupt adds to stack.
                    // Does emitEvent trigger stack processing?
                    // engine.ts: emitEvent does NOT call processEffectStack. 
                    // processEffectStack is called in game loop (passTurn) or manually?
                    // Wait, TriggerEffect logic says: "This logic might push NEW effects to the stack!".
                    // If we rely on stack, we must ensure stack runs.
                    // We can call engine['processEffectStack']();
                    console.log('Processing Effect Stack...');
                    return [4 /*yield*/, engine['processEffectStack']()];
                case 6:
                    _a.sent();
                    // 6. Verification
                    if (!selectionRequested) {
                        console.error('FAIL: requestInput was NOT called.');
                        process.exit(1);
                    }
                    else {
                        console.log('PASS: requestInput was called.');
                    }
                    // Check results
                    // Enemy 1 should be untouched (10)
                    // Enemy 2 should be debuffed (5)
                    if (enemy1.power === 10) {
                        console.log('PASS: Enemy 1 power is 10 (Ignored)');
                    }
                    else {
                        console.error('FAIL: Enemy 1 power is ' + enemy1.power);
                    }
                    if (enemy2.power === 5) {
                        console.log('PASS: Enemy 2 power is 5 (Selected)');
                    }
                    else {
                        console.error('FAIL: Enemy 2 power is ' + enemy2.power);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
runTest().catch(console.error);
