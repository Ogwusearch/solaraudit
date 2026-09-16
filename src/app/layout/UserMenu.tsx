import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export interface UserMenuProps {
  readonly userName?: string;
  readonly userEmail?: string;
  readonly onSignOut?: () => void;
}

export function UserMenu(props: UserMenuProps) {
  const { userName = "Auditor", userEmail, onSignOut } = props;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const initials = userName
    .split(/\s+/)
    .map((s) => s[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    if (onSignOut) onSignOut();
    else navigate("/");
  };

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-menu-name">{userName}</span>
        <span className="user-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="user-menu-popover" role="menu">
          <div className="user-menu-header">
            <strong>{userName}</strong>
            {userEmail && <small>{userEmail}</small>}
          </div>

          <hr />

          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            to="/projects"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My projects
          </Link>

          <hr />

          <button
            type="button"
            role="menuitem"
            className="user-menu-signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}