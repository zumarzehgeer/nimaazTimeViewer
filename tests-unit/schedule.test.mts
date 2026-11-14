import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrayerList, filterCongregational, addIqamahTime } from '../src/lib/prayers.ts'
import { getCountdown } from '../src/lib/countdown.ts'
import { createDemoSettings, demoSchedule } from '../src/demo/fixtures.ts'
import type { PrayerEntry } from '../src/types/index.ts'

const day = new Date(2026, 10, 16)
const at = (h: number, m = 0, s = 0) => new Date(2026, 10, 16, h, m, s)
const prayer = (key: string, time: string): PrayerEntry => ({ key, name: key, time, iqamahTime: null })

test('offsets carry across an hour and midnight', () => {
  assert.equal(addIqamahTime('12:50', 20), '13:10')
  assert.equal(addIqamahTime('23:50 (local)', 20), '00:10')
})
test('explicit manual adhan and iqamah override the calculated values', () => {
  const settings = createDemoSettings()
  settings.manualTimes.Fajr = { adhan: '05:40', iqamah: '06:10' }
  assert.deepEqual(buildPrayerList(demoSchedule, settings).find((p) => p.key === 'Fajr'),
    { name: 'Fajr', key: 'Fajr', time: '05:40', iqamahTime: '06:10' })
})
test('zero-minute iqamah is retained and sunrise has no iqamah', () => {
  const settings = createDemoSettings()
  settings.iqamahOffsets.Fajr = 0
  const entries = buildPrayerList(demoSchedule, settings)
  assert.equal(entries.find((p) => p.key === 'Fajr')?.iqamahTime, '05:30')
  assert.equal(entries.find((p) => p.key === 'Sunrise')?.iqamahTime, null)
})
test('Friday includes Jumuah and excludes Dhuhr and non-congregational entries', () => {
  const entries = filterCongregational(buildPrayerList(demoSchedule, createDemoSettings()), true)
  assert.deepEqual(entries.map((p) => p.key), ['Fajr', 'Jumuah', 'Asr', 'Maghrib', 'Isha'])
  assert.equal(entries[1].time, '13:00')
  assert.equal(entries[1].iqamahTime, '13:30')
})
test('weekdays include Dhuhr and exclude Jumuah', () => {
  assert.deepEqual(filterCongregational(buildPrayerList(demoSchedule, createDemoSettings()), false).map((p) => p.key),
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'])
})
test('Jumuah manual override wins over configured Friday adhan', () => {
  const settings = createDemoSettings()
  settings.manualTimes.Jumuah = { adhan: '13:15', iqamah: '13:45' }
  const jumuah = buildPrayerList(demoSchedule, settings).find((p) => p.key === 'Jumuah')!
  assert.equal(jumuah.time, '13:15')
  assert.equal(jumuah.iqamahTime, '13:45')
})
test('one second before adhan counts down to it; at adhan advances to the next prayer', () => {
  const prayers = [prayer('Fajr', '05:30'), prayer('Dhuhr', '12:30')]
  assert.equal(getCountdown(prayers, day, at(5, 29, 59)).countdown, '00:00:01')
  const result = getCountdown(prayers, day, at(5, 30))
  assert.equal(result.nextPrayer?.key, 'Dhuhr')
  assert.equal(result.countdown, '07:00:00')
})
test('manual reordered times choose the earliest future adhan, not array order', () => {
  assert.equal(getCountdown([prayer('late', '16:00'), prayer('earlier', '15:00')], day, at(14)).nextPrayer?.key, 'earlier')
})
test('after Isha uses tomorrow actual Fajr time across a month boundary', () => {
  const tonight = new Date(2026, 10, 30, 23, 30)
  const tomorrow = new Date(2026, 11, 1)
  const result = getCountdown([prayer('Isha', '19:15')], tonight, tonight, [prayer('Fajr', '05:35')], tomorrow)
  assert.equal(result.nextPrayer?.key, 'Fajr')
  assert.equal(result.countdown, '06:05:00')
  assert.equal(result.isTomorrow, true)
})
test('tomorrow can be selected even if today schedule is absent', () => {
  const result = getCountdown([], day, at(23), [prayer('Fajr', '05:30')], new Date(2026, 10, 17))
  assert.equal(result.countdown, '06:30:00')
  assert.equal(result.isTomorrow, true)
})
test('missing tomorrow data returns an empty state after the final prayer', () => {
  assert.deepEqual(getCountdown([prayer('Isha', '19:15')], day, at(23)),
    { nextPrayer: null, countdown: '00:00:00', isTomorrow: false })
})
test('invalid schedule times are ignored instead of rolling into a different date', () => {
  const entries = [prayer('invalid-hour', '25:00'), prayer('invalid-minute', '12:99'), prayer('bad', 'unknown'), prayer('valid', '15:30 (local)')]
  assert.equal(getCountdown(entries, day, at(12)).nextPrayer?.key, 'valid')
})
test('countdown follows adhan rather than iqamah and preserves seconds', () => {
  const result = getCountdown([{ ...prayer('Dhuhr', '12:30'), iqamahTime: '12:45' }], day, at(12, 29, 30))
  assert.equal(result.countdown, '00:00:30')
})
test('demo settings are isolated objects and do not mutate each other', () => {
  const first = createDemoSettings(), second = createDemoSettings()
  first.iqamahOffsets.Dhuhr = 50
  first.manualTimes.Fajr = { adhan: '06:00' }
  assert.equal(second.iqamahOffsets.Dhuhr, 15)
  assert.deepEqual(second.manualTimes, {})
})
