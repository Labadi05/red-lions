// Everything under /admin stays in English, left-to-right
export default function AdminLayout({ children }) {
  return (
    <div data-admin dir="ltr" lang="en">
      {children}
    </div>
  );
}