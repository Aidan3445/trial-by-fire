export function divideY(index: number) {
  return { 'border-t border-primary': index !== 0 };
}

export function alternateTableRowColors(index: number) {
  return { 'bg-accent': index % 2 === 0, 'bg-background': index % 2 !== 0 };
}
