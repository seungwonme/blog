import Link from "next/link";

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <Link href="/page" className="text-blue-500 hover:underline">
        Page
      </Link>
    </div>
  );
}
