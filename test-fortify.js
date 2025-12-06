// Quick test to see if getEffectivePower is accessible
const code = `
  const unit = { power: 3, owner: 0, slotId: 0 };
  console.log("Unit object:", Object.keys(unit));
  console.log("Has getEffectivePower?", typeof unit.getEffectivePower);
`;
console.log("Testing unit structure:");
eval(code);
