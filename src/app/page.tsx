import ImageList from "@/components/pages/ImageList";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 min-h-screen p-8">
      <section>
        <ImageList></ImageList>
      </section>
    </main>
  );
}
