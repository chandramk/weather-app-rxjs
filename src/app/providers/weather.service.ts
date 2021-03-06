import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs';
declare var _:any;

import { WeatherToday } from '../models/current-weather.model';

@Injectable()
export class WeatherService {

  private baseUrl: string;
  private weatherTodaySub : BehaviorSubject<WeatherToday>;
  private weatherToday: WeatherToday;
  public weatherToday$: Observable<WeatherToday>;
  private dayWiseMap: any;
  private daySelectedSub: BehaviorSubject<string>;
  public daySelected$: Observable<string>;
  public location$: Observable<string>;
  private locationSub: BehaviorSubject<string>;
  private howItFeelsLikeSub: BehaviorSubject<string>;  
  public howItFeelsLike$: Observable<string>;
  public forecastList$: Observable<any>;
  private forecastListSub: BehaviorSubject<any>;
  public currentTemp$: Observable<any>;
  private currentTempSub: BehaviorSubject<any>;
  public chartData$: Observable<any>;
  private chartDataSub: BehaviorSubject<any>;  

  constructor(private _http: Http) {
    this.baseUrl = 'http://api.openweathermap.org/data/2.5/forecast?appid=27d43832d2a4adcb97fcbfa23db130aa&q=';
    this.weatherToday = new WeatherToday();
    this.weatherTodaySub = new BehaviorSubject(this.weatherToday);
    this.weatherToday$ = this.weatherTodaySub.asObservable();
    this.daySelectedSub = new BehaviorSubject('');
    this.daySelected$ = this.daySelectedSub.asObservable();
    this.locationSub = new BehaviorSubject('');
    this.location$ = this.locationSub.asObservable();
    this.howItFeelsLikeSub = new BehaviorSubject('');
    this.howItFeelsLike$ = this.howItFeelsLikeSub.asObservable();
    this.forecastListSub = new BehaviorSubject([]);
    this.forecastList$ = this.forecastListSub.asObservable();
    this.currentTempSub = new BehaviorSubject([]);
    this.currentTemp$ = this.currentTempSub.asObservable();
    this.chartDataSub = new BehaviorSubject({});
    this.chartData$ = this.chartDataSub.asObservable();       
  }

  sendRequestForCity(city: string): Observable<any> {
    const completeURL: string = this.baseUrl + city;
    return this._http.get(completeURL)
    // .do(x => console.log(x))
    .map((data: any) => data.json().list)
    // .do(x => console.log(x))
  }

  public loadWeatherInfoForCity(city: string): Observable<any> {
    return this.sendRequestForCity(city)
    // .do(x => console.log(x))
    .switchMap(forecastList => Observable.of(this.buildDayWiseMap(forecastList)));
    // .mapTo(this.setDayToSeeWeather(new Date().getDay()));
  }

  buildDayWiseMap(forecastList) {
    this.dayWiseMap = 
      forecastList.reduce((acc, listing) => {
      const listingDay = new Date(listing.dt * 1000).getDay();
      if (!(listingDay in acc)) {
        acc[listingDay] = {
          dateTime: [],
          tempMin: [],
          tempMax: [],
          temp: [],
          humidity: [],
          windSpeed: [],
          howItFeelsLike: [],
          howItFeelsLikeDesc: [],
          minTemp: 0,
          maxTemp: 0
        };
      }
      acc[listingDay].dateTime.push(listing.dt * 1000);
      acc[listingDay].tempMin.push(listing.main.temp_min);
      acc[listingDay].tempMax.push(listing.main.temp_max);
      acc[listingDay].temp.push(this.convertFromKelvinToCelcius(listing.main.temp));
      acc[listingDay].humidity.push(listing.main.humidity);
      acc[listingDay].windSpeed.push(listing.wind.speed);
      acc[listingDay].howItFeelsLike.push(listing.weather[0].main);
      acc[listingDay].howItFeelsLikeDesc.push(listing.weather[0].description);
      acc[listingDay].minTemp = acc[listingDay].temp.reduce(this.findMin);
      acc[listingDay].maxTemp = acc[listingDay].temp.reduce(this.findMax);
      return acc;
    }, {});
    // console.log(this.dayWiseMap, _.values(this.dayWiseMap));
    let sortedMap = _.sortBy(this.dayWiseMap, (value) => {
      let dayOfWeek = new Date(value.dateTime[0]).getDay();
      let today = new Date().getDay();
      const diff = dayOfWeek - today;
      return diff < 0 ? diff + 7 : diff;
    });
    // console.log(sortedMap);
    this.forecastListSub.next(_.take(_.values(sortedMap), 5));
    return this.dayWiseMap;
  }

  findMin(a, b) {
    return a < b ? a : b;
  }

  findMax(a, b) {
    return a < b ? b : a;
  } 

  convertFromKelvinToCelcius(temp: number) {
    return _.round(temp - 273.15, 2);
  }

  setDayToSeeWeather(day: number) {
    // console.log(day, this.dayWiseMap);
    this.weatherTodaySub.next(this.dayWiseMap[day]);
    this.daySelectedSub.next(this.getDayOfWeekFor(day));
    this.howItFeelsLikeSub.next(this.dayWiseMap[day].howItFeelsLike[0]);
    this.currentTempSub.next(this.dayWiseMap[day].temp[0]);
    this.chartDataSub.next({
      temp: this.dayWiseMap[day].temp,
      time: this.dayWiseMap[day].dateTime
    });
  }

  getDayOfWeekFor(day: number) {
    switch(day) {
      case 0:
        return "Sunday";
      case 1:
        return "Monday";
      case 2:
        return "Tuesday";
      case 3:
        return "Wednesday";
      case 4:
        return "Thursday";
      case 5:
        return "Friday";
      case 6:
        return "Saturday";
      default:
        return "";
    }
  }



}
