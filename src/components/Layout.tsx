import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/", "Studio"],
  ["/problems", "Problems"],
  ["/drills", "Drills"],
  ["/lab", "Visual lab"],
  ["/mock", "Mock loop"],
  ["/sheets", "Pocket cards"],
] as const;

export function Layout() {
  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <strong>Fovea</strong>
          <span>CV interview lab</span>
        </div>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="rail-foot">Pixels, geometry, detectors. Practice like the onsite.</p>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
