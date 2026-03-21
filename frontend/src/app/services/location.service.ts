import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = 'https://provinces.open-api.vn/api';

  // Fallback data for provinces
  private fallbackProvinces = [
    { code: '01', name: 'Thành phố Hà Nội' },
    { code: '79', name: 'Thành phố Hồ Chí Minh' },
    { code: '31', name: 'Thành phố Hải Phòng' },
    { code: '48', name: 'Thành phố Đà Nẵng' },
    { code: '92', name: 'Thành phố Cần Thơ' },
    { code: '02', name: 'Tỉnh Hà Giang' },
    { code: '04', name: 'Tỉnh Cao Bằng' },
    { code: '06', name: 'Tỉnh Bắc Kạn' },
    { code: '08', name: 'Tỉnh Tuyên Quang' },
    { code: '19', name: 'Tỉnh Lào Cai' },
    { code: '20', name: 'Tỉnh Điện Biên' },
    { code: '22', name: 'Tỉnh Lai Châu' },
    { code: '24', name: 'Tỉnh Sơn La' },
    { code: '25', name: 'Tỉnh Yên Bái' },
    { code: '26', name: 'Tỉnh Hoà Bình' },
    { code: '27', name: 'Tỉnh Thái Nguyên' },
    { code: '30', name: 'Tỉnh Lạng Sơn' },
    { code: '33', name: 'Tỉnh Quảng Ninh' },
    { code: '34', name: 'Tỉnh Bắc Giang' },
    { code: '35', name: 'Tỉnh Phú Thọ' },
    { code: '36', name: 'Tỉnh Vĩnh Phúc' },
    { code: '37', name: 'Tỉnh Bắc Ninh' },
    { code: '39', name: 'Tỉnh Hà Nam' },
    { code: '40', name: 'Tỉnh Hải Dương' },
    { code: '42', name: 'Tỉnh Hưng Yên' },
    { code: '44', name: 'Tỉnh Thái Bình' },
    { code: '45', name: 'Tỉnh Hà Nam' },
    { code: '46', name: 'Tỉnh Nam Định' },
    { code: '47', name: 'Tỉnh Ninh Bình' },
    { code: '49', name: 'Tỉnh Thanh Hóa' },
    { code: '51', name: 'Tỉnh Nghệ An' },
    { code: '52', name: 'Tỉnh Hà Tĩnh' },
    { code: '54', name: 'Tỉnh Quảng Bình' },
    { code: '56', name: 'Tỉnh Quảng Trị' },
    { code: '58', name: 'Tỉnh Thừa Thiên Huế' },
    { code: '60', name: 'Tỉnh Quảng Nam' },
    { code: '62', name: 'Tỉnh Quảng Ngãi' },
    { code: '64', name: 'Tỉnh Bình Định' },
    { code: '66', name: 'Tỉnh Phú Yên' },
    { code: '67', name: 'Tỉnh Khánh Hòa' },
    { code: '68', name: 'Tỉnh Ninh Thuận' },
    { code: '70', name: 'Tỉnh Bình Thuận' },
    { code: '72', name: 'Tỉnh Kon Tum' },
    { code: '74', name: 'Tỉnh Gia Lai' },
    { code: '75', name: 'Tỉnh Đắk Lắk' },
    { code: '77', name: 'Tỉnh Đắk Nông' },
    { code: '78', name: 'Tỉnh Lâm Đồng' },
    { code: '80', name: 'Tỉnh Bình Phước' },
    { code: '82', name: 'Tỉnh Tây Ninh' },
    { code: '83', name: 'Tỉnh Bình Dương' },
    { code: '84', name: 'Tỉnh Đồng Nai' },
    { code: '86', name: 'Tỉnh Bà Rịa - Vũng Tàu' },
    { code: '87', name: 'Tỉnh Long An' },
    { code: '89', name: 'Tỉnh Tiền Giang' },
    { code: '91', name: 'Tỉnh Bến Tre' },
    { code: '93', name: 'Tỉnh Trà Vinh' },
    { code: '94', name: 'Tỉnh Vĩnh Long' },
    { code: '95', name: 'Tỉnh Đồng Tháp' },
    { code: '96', name: 'Tỉnh An Giang' },
    { code: '97', name: 'Tỉnh Kiên Giang' },
    { code: '98', name: 'Tỉnh Cà Mau' },
    { code: '99', name: 'Tỉnh Bạc Liêu' },
    { code: '100', name: 'Tỉnh Sóc Trăng' },
    { code: '101', name: 'Tỉnh Hậu Giang' }
  ];

  constructor(private http: HttpClient) { }

  getProvinces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/p`).pipe(
      catchError(() => {
        console.warn('API không khả dụng, sử dụng dữ liệu fallback');
        return of(this.fallbackProvinces);
      })
    );
  }

  getDistricts(provinceCode: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/p/${provinceCode}?depth=2`).pipe(
      catchError(() => {
        console.warn('Không thể tải danh sách quận/huyện');
        return of({ districts: [] });
      })
    );
  }

  getWards(districtCode: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/d/${districtCode}?depth=2`).pipe(
      catchError(() => {
        console.warn('Không thể tải danh sách phường/xã');
        return of({ wards: [] });
      })
    );
  }
}
