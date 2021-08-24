import axios from 'axios';
import moment from 'moment';
import { useState, useEffect } from 'react';
import { v4 as guid } from 'uuid'

export default function Investmests(props) {
  const baseUrl = 'https://igti-react-investments-backend.herokuapp.com';
  const requestInvestiments = axios.get(`${baseUrl}/investments`)
  const requestReports = axios.get(`${baseUrl}/reports`)

  const [investments, setInvestments] = useState([]);

  function formatCurrency(value) {
    return value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
  }

  function formatPercentual(value) {
    return value.toLocaleString('pt-br', { style: 'percent', currency: 'BRL', minimumFractionDigits: 2 })
  }

  function formatDate(year, month) {
    return moment(`${year}-${month}`).format('MMM/YYYY')
  }

  function sortReports(a, b) {
    if (a.year > b.yerar || a.month > b.month) return 1
    if (a.year < b.yerar || a.month < b.month) return -1
    return 0
  }

  function calcPercentual(actualValue, valuePreviews) {
    if (valuePreviews === 0) return 0
    return ((actualValue - valuePreviews) / valuePreviews) * 1
  }

  function getValuePreviews(year, month, reports) {
    const monthPreviews = +moment(`${year}-${month}`).subtract(1, 'month').format('MM')
    const yearPreviews = +moment(`${year}-${month}`).subtract(1, 'month').format('YYYY')

    const report = reports.find(r => +r.year === yearPreviews && +r.month === monthPreviews)
    return report ? report.value : 0
  }

  function formatColor(percentual) {
    if (percentual === 0) return 'black'
    if (percentual > 0) return 'green'
    return 'red'
  }

  function mapReportsWithValuePreviews(r, i, reports) {
    return {...r, 
      valuePreviews: getValuePreviews(r.year, r.month, reports) 
    }
  }

  function mapReportsWithPercentual(r, i, reports) {
    return {...r,  
      percentual: calcPercentual(r.value, r.valuePreviews)    
    }
  }

  function mapInvestmentsWithTotal(inv, i, investments) {
    return {...inv,  
      total: calcTotalInvestmentByReports(inv.reports)    
    }
  }

  function calcTotalInvestmentByReports(reports) {
    return reports.reduce((a, b) => a + b.value, 0)
  }

  function mapInvestmentsWithTotalPercentual(inv, i, investments) {
    return {...inv,  
      totalPercents: calcTotalPercentualByInvestmentInReportsPercentual(inv.reports)    
    }
  }

  function calcTotalPercentualByInvestmentInReportsPercentual(reports) {
    return reports.reduce((a, b) => a + b.percentual, 0)
  }

console.log('deploy')

  useEffect(() => {
    axios.all([requestInvestiments, requestReports])
      .then(axios.spread((...responses) => {
        const [responseInvestments, responseReports] = responses

        const mapInvestments = responseInvestments
                                  .data
                                  .map(inv => ({
                                    ...inv,
                                    reports: responseReports
                                      .data
                                      .filter(r => r.investmentId === inv.id)
                                      .sort(sortReports)
                                      .map(mapReportsWithValuePreviews)
                                      .map(mapReportsWithPercentual)
                                  }))
                                  .map(mapInvestmentsWithTotal)
                                  .map(mapInvestmentsWithTotalPercentual)

        setInvestments(mapInvestments)
      }))
  });

  return (
    <div>
      <header>
        <div className='bg-blue-100 mx-auto p-4'>
          <h1 className='text-center font-semibold text-xl'>
            react-investments v.1.0.0
          </h1>
        </div>
      </header>

      <main>
        <div className="container mx-auto p-4 block">
          {investments.map((inv, i) => {
            return (
              <>
                <span className="pt-5 flex justify-center font-extralight text-2xl">{inv.description}</span>
                <div className="pt-5 flex justify-center m-5">
                  <span>{'Redimento Total:'}</span>
                  <span style={{
                    color: formatColor(inv.total),
                    marginLeft: 10,
                    marginRight: 10,
                  }}>
                    {
                      `${formatCurrency(inv.total)} `
                    }
                  </span>
                  <span style={{ color: formatColor(inv.totalPercents) }}>(
                    {
                      formatPercentual(inv.totalPercents)
                    })
                  </span>

                </div>
                <div className="border-2 px-5 pb-10 pt-5 rounded-md">
                  <table key={guid()} className="w-full">
                    <tbody>
                      {
                        inv.reports.map((rep, i) => {
                          return (
                            <tr key={guid()} className="w-full border-b-2 h-10 b" style={{backgroundColor: i % 2 ? 'rgb(243, 244, 246)' : 'white'}}>
                              <td className="text-center">{formatDate(rep.year, rep.month)}</td>
                              <td className="text-center">{formatCurrency(rep.value)}</td>
                              <td className="text-center">
                                <span style={{
                                  color: formatColor(rep.percentual)
                                }}>
                                  {
                                    formatPercentual(rep.percentual)
                                  }
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>

              </>
            )
          })}
        </div>
      </main>
    </div>
  );
}

