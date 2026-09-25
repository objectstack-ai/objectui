/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `CalendarView`'s default locale is the DISPLAY locale, never the UI
 * language (objectui#10442).
 *
 * With no `locale` prop the component's `"default"` branch resolved to the
 * `language` that `useCalendarTranslation()` reports, which is the UI
 * language, so a regional display locale (`de-CH` under an English UI) never
 * reached the header, the weekday columns or the day cells. That branch now
 * reads `useDisplayLocale()`. An EXPLICIT `locale` prop is a host's choice and
 * still wins, and that half is pinned here too.
 *
 * The real `I18nProvider` runs with an ENGLISH UI in every case, and the
 * display locale is declared through `LocalizationProvider`, so the display
 * locale is the only thing that differs between the `de-CH` pin and the
 * `en-US` control.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import * as React from 'react'
import { I18nProvider, LocalizationProvider } from '@object-ui/i18n'
import { isMachineLocale, recordLocaleArguments } from '@object-ui/test-support'
import { CalendarView } from './CalendarView'

/** Wed 4 Mar 2020, local midnight (the suite pins `TZ=UTC`). */
const DAY = new Date(2020, 2, 4)

afterEach(cleanup)

function calendarUnder(displayLocale: string, props: { locale?: string } = {}) {
  return (
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <LocalizationProvider value={{ locale: displayLocale }}>
        <CalendarView events={[]} currentDate={DAY} view="month" {...props} />
      </LocalizationProvider>
    </I18nProvider>
  )
}

interface MonthFaces {
  /** The toolbar's month label. */
  header: string
  /** The seven weekday column headers. */
  weekdays: string[]
  /** The accessible name of the 4 March day cell. */
  dayCell: string
}

function facesUnder(displayLocale: string, props: { locale?: string } = {}): MonthFaces {
  const { container } = render(calendarUnder(displayLocale, props))
  const text = container.textContent ?? ''
  const weekdays = [...container.querySelectorAll('[role="columnheader"]')].map((el) => el.textContent ?? '')
  const cells = [...container.querySelectorAll('[role="gridcell"]')]
    .map((el) => el.getAttribute('aria-label') ?? '')
    .filter((l) => l.includes('2020'))
  cleanup()
  const tag = props.locale ?? displayLocale
  const header = DAY.toLocaleDateString(tag, { month: 'long', year: 'numeric' })
  const dayLabel = DAY.toLocaleDateString(tag, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return {
    header: text.includes(header) ? header : `(no "${header}" in: ${text.slice(0, 200)})`,
    weekdays,
    dayCell: cells.find((l) => l.startsWith(dayLabel)) ?? `(no cell starting "${dayLabel}" in: ${JSON.stringify(cells.slice(0, 3))})`,
  }
}

const weekdaysIn = (locale: string) =>
  Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(locale, { weekday: 'short' }))

describe('CalendarView — the default locale is the display locale (objectui#10442)', () => {
  it('renders the month as de-CH under an English UI with a de-CH display locale', () => {
    const faces = facesUnder('de-CH')
    expect(faces.header).toBe('März 2020')
    expect(faces.weekdays).toEqual(weekdaysIn('de-CH'))
    expect(faces.dayCell).toMatch(/^Mittwoch, 4\. März 2020/)
  })

  it('control: renders the month as en-US under an en-US display locale', () => {
    const faces = facesUnder('en-US')
    expect(faces.header).toBe('March 2020')
    expect(faces.weekdays).toEqual(weekdaysIn('en-US'))
    expect(faces.dayCell).toMatch(/^Wednesday, March 4, 2020/)
  })

  /** ⭐ THE PIN: no runner locale can make both readings equal. */
  it('is a reading of the session, not of the machine', () => {
    expect(facesUnder('de-CH')).not.toEqual(facesUnder('en-US'))
  })

  it('an explicit `locale` prop still wins over the display locale', () => {
    const faces = facesUnder('de-CH', { locale: 'fr-FR' })
    expect(faces.header).toBe('mars 2020')
    expect(faces.weekdays).toEqual(weekdaysIn('fr-FR'))
    expect(faces.dayCell).toMatch(/^mercredi 4 mars 2020/)
  })

  it('every locale-taking call receives the declared tag', () => {
    const tree = calendarUnder('de-CH')
    const calls = recordLocaleArguments(() => {
      render(tree)
    })
    cleanup()
    expect(calls.some((c) => c.locale === 'de-CH'), `saw: ${JSON.stringify(calls)}`).toBe(true)
    expect(calls.filter(isMachineLocale), 'these call sites formatted in the machine locale').toEqual([])
    expect(calls.filter((c) => c.locale === 'en'), 'these call sites formatted in the UI language').toEqual([])
  })
})
