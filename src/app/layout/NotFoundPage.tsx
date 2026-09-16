import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h2>Page not found</h2>
      <Link to="/">Back to home</Link>
    </section>
  );
}
