"use client";

import { Button, Input, Label } from "@flyte/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { computeManualOfp, type LegView } from "../../../../lib/compute-manual-ofp.ts";

type LegFields = { distance: string; mt: string };

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function formatFixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

function emptyCell(view: LegView, placeholder: string): string {
  if (view.status === "ok") {
    return "";
  }
  return placeholder;
}

export function ManualOfpForm() {
  const t = useTranslations("plan");
  const [tas, setTas] = useState("");
  const [windDir, setWindDir] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [legs, setLegs] = useState<LegFields[]>([
    { distance: "", mt: "" },
    { distance: "", mt: "" },
  ]);

  const view = useMemo(
    () =>
      computeManualOfp(
        {
          tasKt: parseOptionalNumber(tas),
          windDirDeg: parseOptionalNumber(windDir),
          windSpeedKt: parseOptionalNumber(windSpeed),
        },
        legs.map((leg) => ({
          distanceNm: parseOptionalNumber(leg.distance),
          mtDeg: parseOptionalNumber(leg.mt),
        })),
      ),
    [tas, windDir, windSpeed, legs],
  );

  function updateLeg(index: number, patch: Partial<LegFields>) {
    setLegs((current) => current.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  }

  const incomplete = t("incomplete");
  const hasNoSolution =
    view.total.status === "no-solution" || view.legs.some((leg) => leg.status === "no-solution");

  return (
    <div className="ofp">
      <fieldset className="ofp-cruise">
        <legend>{t("cruiseLegend")}</legend>
        <Label>
          {t("tas")}
          <Input
            inputMode="decimal"
            value={tas}
            onChange={(event) => setTas(event.target.value)}
            autoComplete="off"
          />
        </Label>
        <Label>
          {t("windDir")}
          <Input
            inputMode="decimal"
            value={windDir}
            onChange={(event) => setWindDir(event.target.value)}
            autoComplete="off"
          />
        </Label>
        <Label>
          {t("windSpeed")}
          <Input
            inputMode="decimal"
            value={windSpeed}
            onChange={(event) => setWindSpeed(event.target.value)}
            autoComplete="off"
          />
        </Label>
      </fieldset>

      <div className="ofp-table-wrap">
        <table className="ofp-table">
          <caption className="locale-label">{t("legsCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("legIndex", { n: "#" })}</th>
              <th scope="col">{t("dist")}</th>
              <th scope="col">{t("mt")}</th>
              <th scope="col">{t("wca")}</th>
              <th scope="col">{t("mh")}</th>
              <th scope="col">{t("gs")}</th>
              <th scope="col">{t("time")}</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, index) => {
              const result = view.legs[index] ?? { status: "incomplete" as const };
              const ok = result.status === "ok";
              return (
                <tr key={index}>
                  <th scope="row">{t("legIndex", { n: index + 1 })}</th>
                  <td>
                    <Input
                      aria-label={`${t("dist")} ${index + 1}`}
                      inputMode="decimal"
                      value={leg.distance}
                      onChange={(event) => updateLeg(index, { distance: event.target.value })}
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <Input
                      aria-label={`${t("mt")} ${index + 1}`}
                      inputMode="decimal"
                      value={leg.mt}
                      onChange={(event) => updateLeg(index, { mt: event.target.value })}
                      autoComplete="off"
                    />
                  </td>
                  <td className={result.status === "no-solution" ? "ofp-error" : undefined}>
                    {ok ? formatFixed(result.wcaDeg, 1) : emptyCell(result, incomplete)}
                  </td>
                  <td>{ok ? formatFixed(result.mhDeg, 1) : emptyCell(result, incomplete)}</td>
                  <td>{ok ? formatFixed(result.gsKt, 1) : emptyCell(result, incomplete)}</td>
                  <td>{ok ? String(result.displayMinutes) : emptyCell(result, incomplete)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={6}>
                {t("total")}
              </th>
              <td>{view.total.status === "ok" ? String(view.total.displayMinutes) : incomplete}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasNoSolution ? (
        <p className="ofp-error" role="status">
          {t("noSolution")}
        </p>
      ) : null}

      <div className="ofp-actions">
        <Button
          type="button"
          onClick={() => setLegs((current) => [...current, { distance: "", mt: "" }])}
        >
          {t("addLeg")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={legs.length <= 1}
          onClick={() =>
            setLegs((current) => (current.length <= 1 ? current : current.slice(0, -1)))
          }
        >
          {t("removeLeg")}
        </Button>
      </div>
    </div>
  );
}
