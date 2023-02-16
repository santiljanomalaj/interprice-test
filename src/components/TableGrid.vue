<template>
  <b-container>
    <div class="d-flex gap-5">
      <b-button-group>
        <b-button
          v-for="currency in currencies"
          v-bind:key="currency"
          class="currency"
          :class="activeCurrency === currency ? 'active' : ''"
          @click="() => handleCurrency(currency)"
        >
          {{ currency }}
        </b-button>
      </b-button-group>

      <b-button-group>
        <b-button
          v-for="year in years"
          v-bind:key="year"
          class="year"
          :class="activeYears.includes(year) ? 'active' : ''"
          @click="(e) => handleYear(e, year)"
        >
          {{ year }} YRS
        </b-button>
      </b-button-group>

      <b-button-group>
        <b-button
          v-for="dis in displays"
          v-bind:key="dis"
          :class="activeDisplay === dis ? 'active' : ''"
          @click="() => handleDisplay(dis)"
        >
          {{ dis }}
        </b-button>
      </b-button-group>
    </div>
    <b-row class="mt-5">
      <b-col md="4">
        <b-form-input placeholder="Filter by company name" @input="(e) => filterBy(e)"></b-form-input>
      </b-col>
    </b-row>

    <div class="data-grid mt-5">
      <div class="grid-header">
        <div class="date">
          <a role="button" class="sort-key" @click="(e) => handleSortDate(e, 'DateSent')">
            Date Sent
            <b-icon icon="caret-down-fill" class="down" />
            <b-icon icon="caret-up-fill" class="up" />
          </a>
        </div>
        <div class="company">
          <a role="button" class="sort-key" @click="(e) => handleSortString(e, 'Company')">
            Company
            <b-icon icon="caret-down-fill" class="down" />
            <b-icon icon="caret-up-fill" class="up" />
          </a>
        </div>
        <b-row class="years">
          <b-col md="4" v-for="year in activeYears" v-bind:key="year">
            <div class="text-center head">{{ year }} YRS</div>
            <b-row class="py-2">
              <b-col sm="6" class="text-center">FIX</b-col>
              <b-col sm="6" class="text-center">FRN</b-col>
            </b-row>
          </b-col>
        </b-row>
      </div>
      <div class="grid-body">
        <div v-for="item in items" v-bind:key="item.Id">
          <div class="item-line py-2 d-flex">
            <div class="date">
              <a role="button" class="collaps-btn" v-if="item.Quote" v-b-toggle="`collaps-${item.Id}`" >
                <b-icon icon="chevron-right" class="down" />
                <b-icon icon="chevron-down" class="up" />
              </a>
              {{ dateFormat(item.DateSent) }}
            </div>
            <div class="company" :class="item.Quote ? 'fw-bold' : 'text-grey'">{{ item.Company }}</div>
            <b-row class="years">
              <b-col md="4" v-for="year in activeYears" v-bind:key="year">
                <b-row class="py-2">
                  <b-col sm="6" class="text-center">
                    {{ calcValue(item, year, 'FIX', activeDisplay) }}
                  </b-col>
                  <b-col sm="6" class="text-center">
                    {{ calcValue(item, year, 'FRN', activeDisplay) }}
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
          </div>
          <b-collapse :id="`collaps-${item.Id}`">
            <div v-if="item.Quote" class="item-line d-flex py-2" v-for="dis in displays.filter((e) => e !== activeDisplay)" v-bind:key="dis">
              <div class="date"></div>
              <div class="company">{{ dis }}</div>
              <b-row class="years">
                <b-col md="4" v-for="year in activeYears" v-bind:key="year">
                  <b-row class="py-2">
                    <b-col sm="6" class="text-center">
                      {{ calcValue(item, year, 'FIX', dis) }}
                    </b-col>
                    <b-col sm="6" class="text-center">
                      {{ calcValue(item, year, 'FRN', dis) }}
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>
            </div>
          </b-collapse>
        </div>
        <div v-if="items.length === 0" class="text-center py-3">No Search Data</div>
        <div class="average d-flex align-items-center py-2">
          <div class="date"></div>
          <div class="company">Average {{ activeDisplay }}</div>
          <b-row class="years">
            <b-col md="4" v-for="year in activeYears" v-bind:key="year">
              <b-row class="py-2">
                <b-col sm="6" class="text-center">
                  {{ calcAverage(year, 'FIX') }}
                </b-col>
                <b-col sm="6" class="text-center">
                  {{ calcAverage(year, 'FRN') }}
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </div>
      </div>
    </div>
  </b-container>
</template>

<script>
import JsonData from "../../data.json";
import moment from 'moment'

export default {
  data() {
    return {
      data: [],
      currencies: [],
      years: [],
      items: [],
      activeDisplay: '',
      activeCurrency: "",
      activeYears: [],
      displays: ['Spread', 'Yield', '3MLSpread']
    };
  },
  created() {
    this.data = JsonData.Items;
    this.initialize();
  },
  methods: {
    initialize() {
      const currencies = [];
      this.data.map(d => {
        if (d.Quote) {
          d.Quote.map(e => {
            currencies.push(e.Currency);
          });
        }
      });
      this.currencies = [...new Set(currencies)];
      this.activeCurrency = this.currencies[0];
      this.setYears();
      this.handleCurrency(this.activeCurrency)
      this.activeDisplay = this.displays[0]
      this.initializeSort()
    },
    setYears() {
      const years = [];
      this.data.map(d => {
        if (d.Quote) {
          d.Quote.map(e => {
            if (e.Currency === this.activeCurrency) {
              years.push(e.Years);
            }
          });
        }
      });
      this.years = [...new Set(years)];
      this.activeYears = this.years
    },
    calcValue(item, year, type, display) {
      let fixVal = 0
      if(item.Quote) {
        item.Quote.map((e) => {
          if(e.Years === year * 1 && e.CouponType === type)  fixVal += e[display]
        })
      }
      
      switch (display) {
        case 'Spread':
          if(fixVal === 0) fixVal = ''
          else fixVal = '+' + fixVal + 'bp'
          break;

        case 'Yield':
          if(fixVal === 0) fixVal = ''
          else fixVal = fixVal + '%'
          break;

        case '3MLSpread':
          if(fixVal === 0) fixVal = ''
          else fixVal = '+' + fixVal + 'bp'
          break;
      
        default:
          break;
      }

      return fixVal
    },
    calcAverage(year, type) {
      let value = 0
      let i = 0
      this.items.map((d) => {
        if (d.Quote) {
          d.Quote.map((e) => {
            if(e.CouponType === type && e.Years === year) 
            {
              value += e[this.activeDisplay]
              i ++
            }
          })
        }
      })
      if(value !== 0) value = value / i
      switch (this.activeDisplay) {
        case 'Spread':
          if(value === 0) value = ''
          else value = '+' + value + 'bp'
          break;

        case 'Yield':
          if(value === 0) value = ''
          else value = value.toFixed(3) + '%'
          break;

        case '3MLSpread':
          if(value === 0) value = ''
          else value = '+' + value + 'bp'
          break;
      
        default:
          break;
      }
      return value
    },
    dateFormat(value) {
      let date
      if(value) date = moment(String(value)).format('DD-MMM-YY')
      else date = ''
      return date
    },
    handleCurrency(value) {
      this.activeCurrency = value
      this.setYears()
      const newItems = []
      this.data.map(d => {
        const json = {
          Id: d.Id,
          DateSent: d.DateSent,
          Company: d.Company,
          Preferred: d.Preferred,
          Quote: null
        }
        if (d.Quote) {
          const quotes = []
          d.Quote.map(e => {
            if(e.Currency === value) {
              quotes.push(e)
            }
          });
          json.Quote = quotes
        }
        newItems.push(json)
      });
      this.items = newItems
    },
    handleYear(e, value) {
      const isActive = e.currentTarget.classList.contains('active')
      if(isActive) {
        const years = this.activeYears.filter((e) => e !== value)
        this.activeYears = years
      } else {
        const index = this.years.findIndex((e) => e === value)
        const years = [
          ...this.activeYears.slice(0, index),
          value,
          ...this.activeYears.slice(index)
        ]
        this.activeYears = years
      }
    },
    handleDisplay(value) {
      this.activeDisplay = value
    },
    filterBy(text) {
      const items = this.data.filter((e) => e.Company.toLowerCase().indexOf(text) > -1)
      this.items = items
    },
    initializeSort() {
      const data = this.items.sort((a, b) => {
        var dateA = new moment(a.DateSent).format('YYYYMMDD')
        var dateB = new moment(b.DateSent).format('YYYYMMDD')
        return (dateA > dateB) ? 1 : -1;
      })
      const items = data.sort((p1, p2) => (p1.Preferred * 1 > p2.Preferred * 1) ? 1 : (p1.Preferred * 1 < p2.Preferred * 1) ? -1 : 0);
      this.items = items.sort((p1, p2) => p1.Quote === null ? 1 : p2.Quote === null ? -1 : 0 )
    },
    handleSortDate(e, key) {
      const sorted = e.currentTarget.classList.contains('sorted')
      if(!sorted) {
        const data = this.items.sort((a, b) => {
          var dateA = new moment(a[key]).format('YYYYMMDD')
          var dateB = new moment(b[key]).format('YYYYMMDD')
          return dateA < dateB ? 1 : -1;
        })
        this.items = data.sort((p1, p2) => p1.Quote === null ? 1 : p2.Quote === null ? -1 : 0 )
      } else {
        const data = this.items.sort((a, b) => {
          var dateA = new moment(a[key]).format('YYYYMMDD')
          var dateB = new moment(b[key]).format('YYYYMMDD')
          return dateA > dateB ? 1 : -1;
        })
        this.items = data.sort((p1, p2) => p1.Quote === null ? 1 : p2.Quote === null ? -1 : 0 )
      }
      e.currentTarget.classList.toggle('sorted')
    },
    handleSortString(e, key) {
      const sorted = e.currentTarget.classList.contains('sorted')
      if(!sorted) {
        const data = this.items.sort((p1, p2) => (p1[key] < p2[key]) ? 1 : (p1[key] > p2[key]) ? -1 : 0);
        this.items = data.sort((p1, p2) => p1.Quote === null ? 1 : p2.Quote === null ? -1 : 0 )
      } else {
        const data = this.items.sort((p1, p2) => (p1[key] > p2[key]) ? 1 : (p1[key] < p2[key]) ? -1 : 0);
        this.items = data.sort((p1, p2) => p1.Quote === null ? 1 : p2.Quote === null ? -1 : 0 )
      }
      e.currentTarget.classList.toggle('sorted')
    }
  }
};
</script>

<style>
.text-grey {
  color: #999191;
}

.data-grid {
  width: 100%;
}

.data-grid .grid-header {
  display: flex;
  align-items: center;
  border-bottom: 3px solid #ebe5e5;
}

.grid-header .date, .grid-body .date {
  width: 20%;
}

.grid-header .company, .grid-body .company {
  width: 30%;
}
.grid-header .years, .grid-body .years {
  width: 50%;
}

.grid-header .years .head {
  border-bottom: 2px solid #ebe5e5;
}

.grid-body .item-line {
  border-bottom: 2px solid #ebe5e5;
}

.collaps-btn {
  text-decoration: none;
  color: black;
}

.collaps-btn.collapsed .up {
  display: none;
}

.collaps-btn.not-collapsed .down {
  display: none;
}

.average {
  border: 2px solid #999999;
}

.sort-key {
  text-decoration: none;
  color: black;
}

.sort-key:not(.sorted) .up {
  display: none;
}

.sort-key.sorted .down {
  display: none;
}
</style>
