import { useTranslation } from "react-i18next";

const statKeys = [
  { valueKey: "landing.stats.s1Value", labelKey: "landing.stats.s1Label" },
  { valueKey: "landing.stats.s2Value", labelKey: "landing.stats.s2Label" },
  { valueKey: "landing.stats.s3Value", labelKey: "landing.stats.s3Label" },
  { valueKey: "landing.stats.s4Value", labelKey: "landing.stats.s4Label" },
];

export const LandingStats = () => {
  const { t } = useTranslation();

  return (
    <section id="stats" className="py-24 lg:py-[100px] bg-black">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {statKeys.map((s) => (
            <div key={s.labelKey} className="text-start">
              <p className="text-3xl lg:text-[42px] font-bold text-white tracking-[-1px] mb-2">
                {t(s.valueKey)}
              </p>
              <p className="text-sm text-[#999] uppercase tracking-wider">
                {t(s.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
