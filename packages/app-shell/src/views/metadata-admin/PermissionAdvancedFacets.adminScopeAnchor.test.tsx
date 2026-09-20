// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Pins that the Delegated Admin Scope facet cannot author an `adminScope` the
 * framework spec refuses, and that a draft already carrying one says so on its
 * own collapsed header (objectui#9464).
 *
 * `AdminScopeSchema` makes `businessUnit` the one REQUIRED key — the other five
 * carry defaults — so `{ includeSubtree: true }` is refused wholesale. The facet
 * patched the draft key by key from every control, so flipping any switch
 * BEFORE naming a business unit wrote exactly that object, and the section's own
 * badge counted only `businessUnit` / `assignablePermissionSets` and so read
 * "nothing configured here" for the draft that had just blocked Save.
 *
 * Both legs are driven through the EDITOR rather than asserted against the
 * schema alone: the schema is correct and is not what was broken. The schema
 * readings kept below are CONTROLS — a `false` on the payload leg is then a
 * reading about the payload and not about a broken import.
 *
 * ⚠️ The repair is a WRITE gate, not a prune: nothing already in the draft is
 * discarded, because a permission editor that quietly un-does an author's
 * switch is a worse defect than the one this pins.
 */

import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminScopeSchema } from "@objectstack/spec/security";
import { PermissionAdvancedFacets } from "./PermissionAdvancedFacets";

afterEach(cleanup);

const t = (k: string) => k;

type Draft = Record<string, unknown>;

/** The draft as the host would hold it — the updater's result is kept, so a
 *  second interaction sees what the first one wrote. */
let latest: Draft = {};

function Harness({ initial, sets }: { initial: Draft; sets: string[] }) {
  const [draft, setDraft] = React.useState<Draft>(initial);
  // In an effect, not during render: `react-hooks/globals` bans the latter, and
  // `userEvent` flushes effects before the assertion reads this back.
  React.useEffect(() => {
    latest = draft;
  }, [draft]);
  return (
    <PermissionAdvancedFacets
      draft={draft}
      setDraft={setDraft}
      writable
      allSetNames={sets}
      t={t}
    />
  );
}

async function mountFacet(initial: Draft, sets: string[] = []) {
  const user = userEvent.setup();
  latest = initial;
  render(<Harness initial={initial} sets={sets} />);
  // The Delegated Admin Scope section is collapsed by default.
  await user.click(screen.getByText("perm.admin.title"));
  return user;
}

/** The section header, whose `Badge` is the collapsed summary count. */
const adminHeader = () =>
  screen.getByText("perm.admin.title").closest("button") as HTMLElement;

/** A switch lives inside the `<label>` that carries its caption. */
const switchFor = (captionKey: string) =>
  within(
    screen.getByText(captionKey).closest("label") as HTMLElement,
  ).getByRole("switch");

describe("PermissionAdvancedFacets · delegated admin scope (objectui#9464)", () => {
  it("CONTROL — the spec accepts a scope that names a business unit", () => {
    expect(
      AdminScopeSchema.safeParse({ businessUnit: "bu_sales" }).success,
    ).toBe(true);
  });

  it("CONTROL — and refuses the object a bare switch flip used to write", () => {
    const verdict = AdminScopeSchema.safeParse({ includeSubtree: true });
    expect(verdict.success).toBe(false);
    expect(
      verdict.error?.issues.some((i) => i.path[0] === "businessUnit"),
    ).toBe(true);
  });

  it("Include subtree writes no scope until a business unit names one", async () => {
    const user = await mountFacet({});
    await user.click(switchFor("perm.admin.includeSubtree"));

    const written = latest.adminScope;
    expect(
      written === undefined || AdminScopeSchema.safeParse(written).success,
      `the editor wrote ${JSON.stringify(written)}, which the spec refuses`,
    ).toBe(true);
    expect(written).toBeUndefined();
  });

  it("the three manage-* switches are inert for the same reason", async () => {
    const user = await mountFacet({});
    for (const key of [
      "perm.admin.manageAssignments",
      "perm.admin.manageBindings",
      "perm.admin.authorEnvironmentSets",
    ]) {
      await user.click(switchFor(key));
    }
    expect(latest.adminScope).toBeUndefined();
  });

  it("the assignable-set buttons are inert for the same reason", async () => {
    const user = await mountFacet({}, ["ps_support"]);
    await user.click(screen.getByRole("button", { name: "ps_support" }));
    expect(latest.adminScope).toBeUndefined();
  });

  it("names the reason, and only while the boundary is missing", async () => {
    const user = await mountFacet({});
    expect(screen.getByText("perm.admin.businessUnitRequired")).toBeTruthy();
    expect(switchFor("perm.admin.includeSubtree")).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "bu_sales");

    expect(screen.queryByText("perm.admin.businessUnitRequired")).toBeNull();
    expect(switchFor("perm.admin.includeSubtree")).not.toBeDisabled();
  });

  it("once a business unit is named, the switches write a scope the spec accepts", async () => {
    const user = await mountFacet({ adminScope: { businessUnit: "bu_sales" } });
    await user.click(switchFor("perm.admin.includeSubtree"));

    expect(latest.adminScope).toEqual({
      businessUnit: "bu_sales",
      includeSubtree: true,
    });
    expect(AdminScopeSchema.safeParse(latest.adminScope).success).toBe(true);
  });

  it("a draft already carrying an unsaveable scope says so on the collapsed header", async () => {
    // Exactly what the pre-fix editor wrote, and what a stored row may hold.
    await mountFacet({ adminScope: { includeSubtree: true } });
    expect(within(adminHeader()).getByText("1")).toBeTruthy();
  });

  it("an empty scope still reports itself as empty", async () => {
    await mountFacet({});
    expect(within(adminHeader()).queryByText("1")).toBeNull();
  });
});
