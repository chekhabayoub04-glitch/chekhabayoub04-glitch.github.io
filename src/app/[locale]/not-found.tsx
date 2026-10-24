import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("detail");
  return (
    <div className="container-x grid min-h-[70svh] place-items-center pt-[72px] text-center">
      <div>
        <p className="font-display text-[120px] font-black leading-none text-signal">404</p>
        <Link href="/cars" className="btn btn-ghost mt-6">
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
