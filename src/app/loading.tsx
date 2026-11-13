// Rota gecislerinde icerik bos kalip portal arka plani "flash" gibi
// gorunmesin diye: ayni kampanya arka planini + ince spinner'i gosterir.
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[99998]"
      style={{ backgroundColor: "#3a0705" }}
    >
      <style>{`
        .pl-route-loader-bg {
          position: absolute; inset: 0;
          background-image: url("/bg-desktop.webp");
          background-size: cover; background-position: top center; background-repeat: no-repeat;
        }
        @media (max-width: 768px) {
          .pl-route-loader-bg { background-image: url("/bg-mobile.webp"); }
        }
      `}</style>
      <div className="pl-route-loader-bg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#ffc800]" />
      </div>
    </div>
  );
}
