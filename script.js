// ==============================================================================
// 1. 설정 및 상수
// ==============================================================================

// TODO: Vercel 환경 변수를 안전하게 사용하는 로직으로 대체해야 합니다.
// 로컬 테스트를 위해 발급받은 API Key를 YOUR_API_KEY 자리에 임시로 넣어주세요.
const API_KEY = 'YOUR_API_KEY'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const UNITS = 'metric'; // 초기 단위는 섭씨 (Metric)

// ==============================================================================
// 2. DOM 요소 연결 (뷰 조작을 위한 준비) [cite: 56]
// ==============================================================================

const searchBtn = document.querySelector('#searchBtn');
const cityInput = document.querySelector('#cityInput');
const cityNameDisplay = document.querySelector('#cityName');
const currentTempDisplay = document.querySelector('#currentTemp');
const weatherDescDisplay = document.querySelector('#weatherDesc');
const forecastContainer = document.querySelector('#forecastContainer');
const toggleUnitBtn = document.querySelector('#toggleUnitBtn');

// ==============================================================================
// 3. 유틸리티 함수
// ==============================================================================

/**
 * OpenWeatherMap API URL을 생성합니다.
 * @param {string} city - 검색할 도시 이름
 * @param {string} type - 'weather' (현재 날씨) 또는 'forecast' (5일 예보)
 * @returns {string} 완성된 API URL
 */
function createWeatherUrl(city, type) {
    // URL 인코딩: 도시 이름에 공백 등이 있을 경우를 대비
    const encodedCity = encodeURIComponent(city);
    return `${BASE_URL}/${type}?q=${encodedCity}&appid=${API_KEY}&units=${UNITS}`;
}

// ==============================================================================
// 4. 비즈니스 로직 (API 호출 및 데이터 처리) [cite: 23, 40, 41]
// ==============================================================================

/**
 * 도시 이름으로 현재 날씨 및 예보 데이터를 가져옵니다.
 * @param {string} city - 검색할 도시 이름
 */
async function getWeather(city) {
    // 1. 현재 날씨 및 예보 API URL 생성
    const weatherUrl = createWeatherUrl(city, 'weather');
    const forecastUrl = createWeatherUrl(city, 'forecast');

    // 2. Promise.all로 두 API를 동시에 호출하여 대기
    const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
    ]);

    // 3. 오류 처리: HTTP 응답 코드가 200번대가 아닐 경우 [cite: 28]
    if (!weatherResponse.ok || !forecastResponse.ok) {
        throw new Error('도시를 찾을 수 없거나 API 호출에 실패했습니다.');
    }

    // 4. JSON 파싱
    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();
    
    // 5. 다음 단계 함수 호출: 뷰 업데이트
    displayWeather(weatherData, forecastData);
    
    // TODO: 최근 검색어 저장 로직 호출 (5개 이하) [cite: 29]
}

// ==============================================================================
// 5. 뷰 로직 (DOM 업데이트 및 UI 조작) [cite: 40]
// ==============================================================================

/**
 * 가져온 날씨 데이터를 DOM에 표시합니다.
 * @param {object} weatherData - 현재 날씨 JSON 데이터
 * @param {object} forecastData - 5일 예보 JSON 데이터
 */
function displayWeather(weatherData, forecastData) {
    // 1. 현재 날씨 표시 [cite: 24]
    const currentTemp = weatherData.main.temp;
    const description = weatherData.weather[0].description;
    const iconCode = weatherData.weather[0].icon; // 날씨 아이콘 코드 (예: '01d')
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;

    cityNameDisplay.textContent = weatherData.name;
    currentTempDisplay.textContent = `${Math.round(currentTemp)}°C`;
    weatherDescDisplay.textContent = description;

    // TODO: 습도, 풍속 등 추가 정보 DOM에 표시 [cite: 24]
    // TODO: 날씨/시간에 따른 배경/아이콘 변화 로직 추가 [cite: 27]

    // 2. 단기 예보 카드 생성 (5일 예보 카드) [cite: 25]
    forecastContainer.innerHTML = ''; // 기존 예보 초기화

    // OpenWeatherMap 5일 예보(3시간 간격) 중 다음 5개의 날짜만 필터링하여 카드 생성
    // (더 정확한 로직은 날짜 변경 시점의 데이터를 찾는 것이 좋으나, 여기서는 단순화)
    const dailyForecasts = forecastData.list.filter((item, index) => index % 8 === 0 && index < 40);

    // 최소 3~5일 단기 예보 카드 생성 [cite: 25]
    dailyForecasts.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const temp = Math.round(day.main.temp);
        const desc = day.weather[0].description;
        const icon = day.weather[0].icon;

        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');
        forecastCard.innerHTML = `
            <p class="date">${date}</p>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
            <p class="temp">${temp}°C</p>
            <p class="desc">${desc}</p>
        `;
        forecastContainer.appendChild(forecastCard);
    });
}

// ==============================================================================
// 6. 오류 처리 및 기타 기능
// ==============================================================================

/**
 * API 호출 또는 데이터 처리 중 발생한 오류를 처리합니다. [cite: 28, 40]
 * @param {Error} error - 발생한 오류 객체
 */
function handleError(error) {
    console.error('API Error:', error.message);
    // 사용자에게 오류 메시지 표시
    alert('오류 발생: ' + error.message); 
    cityNameDisplay.textContent = '검색 실패';
    currentTempDisplay.textContent = '--';
    weatherDescDisplay.textContent = '도시를 다시 확인해주세요.';
    forecastContainer.innerHTML = '';
}

// TODO: 섭씨 ↔ 화씨 변환 로직 함수 추가 [cite: 26]
function toggleTemperatureUnit() {
    // 여기에 섭씨/화씨 변환 및 화면 업데이트 로직을 구현합니다.
    alert('단위 변환 로직 구현 예정!');
}

// ==============================================================================
// 7. 이벤트 리스너 (사용자 상호작용) [cite: 22, 39]
// ==============================================================================

// 검색 버튼 클릭 이벤트 처리
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city).catch(handleError); // API 호출 및 오류 처리 연결
    } else {
        alert('도시 이름을 입력해주세요.');
    }
});

// 엔터 키 이벤트 처리 [cite: 22]
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

// 단위 전환 버튼 이벤트 처리 [cite: 26]
toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);

// TODO: 페이지 로드 시 최근 검색어 버튼 리스트 생성 및 초기 날씨 표시 로직 추가 [cite: 29]