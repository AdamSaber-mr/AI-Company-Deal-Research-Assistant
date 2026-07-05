// Hermount per navigatie → elke pagina fadet zacht in. Bewust alleen
// opacity (geen transform): transforms op een voorouder breken position:
// fixed/sticky van o.a. de chatcomposer en menu-overlays.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-fade">{children}</div>;
}
