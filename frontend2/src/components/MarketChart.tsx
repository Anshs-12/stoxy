import { useEffect, useRef, useState } from 'react'
import { AreaSeries, CandlestickSeries, ColorType, HistogramSeries, createChart, type Time } from 'lightweight-charts'
import { BarChart3, CandlestickChart, LoaderCircle } from 'lucide-react'
import { chartApi, type CandleDataDTO } from '../lib/api'
import { Button } from './ui/button'

type Range = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | '10Y'
type ChartStyle = 'area' | 'candle'
type Interval = { label: string; unit: string; interval: string; intraday: boolean }
const intervals: Record<Range, Interval[]> = {
  '1D': [{ label: '1m', unit: 'minutes', interval: '1', intraday: true }, { label: '5m', unit: 'minutes', interval: '5', intraday: true }, { label: '15m', unit: 'minutes', interval: '15', intraday: true }, { label: '30m', unit: 'minutes', interval: '30', intraday: true }, { label: '1h', unit: 'minutes', interval: '60', intraday: true }],
  '1W': [{ label: '1h', unit: 'hours', interval: '1', intraday: false }, { label: '2h', unit: 'hours', interval: '2', intraday: false }, { label: '3h', unit: 'hours', interval: '3', intraday: false }],
  '1M': [{ label: '1h', unit: 'hours', interval: '1', intraday: false }, { label: '2h', unit: 'hours', interval: '2', intraday: false }, { label: '1D', unit: 'days', interval: '1', intraday: false }],
  '3M': [{ label: '2h', unit: 'hours', interval: '2', intraday: false }, { label: '1D', unit: 'days', interval: '1', intraday: false }, { label: '1W', unit: 'weeks', interval: '1', intraday: false }],
  '6M': [{ label: '1D', unit: 'days', interval: '1', intraday: false }, { label: '1W', unit: 'weeks', interval: '1', intraday: false }],
  '1Y': [{ label: '1D', unit: 'days', interval: '1', intraday: false }, { label: '1W', unit: 'weeks', interval: '1', intraday: false }, { label: '1M', unit: 'months', interval: '1', intraday: false }],
  '5Y': [{ label: '1W', unit: 'weeks', interval: '1', intraday: false }, { label: '1M', unit: 'months', interval: '1', intraday: false }],
  '10Y': [{ label: '1M', unit: 'months', interval: '1', intraday: false }],
}
function toTime(candle: CandleDataDTO, intraday: boolean): Time {
  return intraday
    ? (Math.floor(new Date(candle.date).getTime() / 1000) + 19_800) as Time
    : candle.date.split('T')[0] as Time
}

export function MarketChart({ instrumentKey }: { instrumentKey: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [range, setRange] = useState<Range>('1D')
  const [selectedInterval, setSelectedInterval] = useState<Interval>(intervals['1D'][2])
  const [style, setStyle] = useState<ChartStyle>('area')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!host.current) return
    const option = selectedInterval
    const chart = createChart(host.current, {
      width: host.current.clientWidth,
      height: 330,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#766e66', fontSize: 11, fontFamily: 'DM Mono' },
      grid: { vertLines: { color: 'rgba(38,36,36,.06)' }, horzLines: { color: 'rgba(38,36,36,.08)' } },
      rightPriceScale: { borderColor: 'rgba(38,36,36,.16)', minimumWidth: 66 },
      timeScale: { borderColor: 'rgba(38,36,36,.16)', timeVisible: option.intraday, secondsVisible: false },
      crosshair: { vertLine: { color: 'rgba(255,79,0,.35)', labelBackgroundColor: '#ff4f00' }, horzLine: { color: 'rgba(255,79,0,.35)', labelBackgroundColor: '#ff4f00' } },
    })
    let cancelled = false
    setLoading(true); setError('')
    const render = async () => {
      try {
        const raw = option.intraday
          ? await chartApi.intraday(instrumentKey, option.unit, option.interval)
          : await chartApi.history(instrumentKey, range, option.unit, option.interval)
        if (cancelled) return
        const unique = raw.filter((candle, index, values) => values.findIndex(item => toTime(item, option.intraday) === toTime(candle, option.intraday)) === index)
        if (!unique.length) throw new Error('No chart data available for this range.')
        if (style === 'area') {
          const series = chart.addSeries(AreaSeries, { lineColor: '#ff4f00', topColor: 'rgba(255,79,0,.20)', bottomColor: 'rgba(255,79,0,0)', lineWidth: 2, priceLineVisible: false })
          series.setData(unique.map(candle => ({ time: toTime(candle, option.intraday), value: candle.close })))
        } else {
          const series = chart.addSeries(CandlestickSeries, { upColor: '#ff4f00', downColor: '#88786c', borderVisible: false, wickUpColor: '#ff4f00', wickDownColor: '#88786c' })
          series.setData(unique.map(candle => ({ time: toTime(candle, option.intraday), open: candle.open, high: candle.high, low: candle.low, close: candle.close })))
        }
        const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: .78, bottom: 0 } })
        volume.setData(unique.map(candle => ({ time: toTime(candle, option.intraday), value: candle.volume, color: candle.close >= candle.open ? 'rgba(255,79,0,.32)' : 'rgba(136,120,108,.28)' })))
        chart.timeScale().fitContent()
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load chart data.')
      } finally { if (!cancelled) setLoading(false) }
    }
    void render()
    const resize = new ResizeObserver(() => { if (host.current) chart.applyOptions({ width: host.current.clientWidth }) })
    resize.observe(host.current)
    return () => { cancelled = true; resize.disconnect(); chart.remove() }
  }, [instrumentKey, range, selectedInterval, style])

  const changeRange = (next: Range) => { setRange(next); setSelectedInterval(intervals[next][0]) }
  return <section className="market-chart"><div className="market-chart__head"><div><p className="micro">LIVE PRICE CHART</p><h3>Price action <em>in context.</em></h3></div><div className="chart-toggles"><Button variant={style === 'area' ? 'default' : 'ghost'} size="sm" onClick={() => setStyle('area')}><BarChart3 size={13}/> Line</Button><Button variant={style === 'candle' ? 'default' : 'ghost'} size="sm" onClick={() => setStyle('candle')}><CandlestickChart size={13}/> Candle</Button></div></div><div className="chart-intervals">{intervals[range].map(option => <button className={selectedInterval.label === option.label ? 'active' : ''} key={option.label} onClick={() => setSelectedInterval(option)}>{option.label}</button>)}</div><div className="market-chart__canvas"><div ref={host}/>{loading && <div className="chart-state"><LoaderCircle size={20} className="spin"/>Loading live candles…</div>}{error && !loading && <div className="chart-state chart-state--error">{error}</div>}</div><div className="chart-ranges">{(Object.keys(intervals) as Range[]).map(item => <button key={item} onClick={() => changeRange(item)} className={range === item ? 'active' : ''}>{item}</button>)}</div></section>
}
