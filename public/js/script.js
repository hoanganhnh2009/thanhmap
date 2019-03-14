let map, infoWindow, marker;
// Hàm này được thự hiện khi trình duyệt đã load thành công google map sdk
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 12
    });
    infoWindow = new google.maps.InfoWindow;

    // Lấy vị trí hiện tại, người dùng phải cho phép trình duyệt truy cập thông tin vị trí
    // Try HTML5 geolocation. 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            let pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Bạn đang ở đây!');
            infoWindow.open(map);
            map.setCenter(pos);
            //Add listener, Sự kiện click chuột phải lên map, tạo ra một marker
            google.maps.event.addListener(map, "rightclick", mapOnRightClick);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function mapOnRightClick(event) {
    let lat = event.latLng.lat();
    let lng = event.latLng.lng();
    addUserMarker(lat, lng);
}

// Tạo ra một marker khi người dùng click chuột phải lên map tại vị trí click
function addUserMarker(lat, lng) {
    let latlng = new google.maps.LatLng(lat, lng);
    if (marker) {
        marker.setPosition(latlng)
    } else {
        let location = { lat, lng };
        marker = new google.maps.Marker({
            position: location,
            label: 'A',
            draggable: true,
            map: map
        });
        // xử lý dự kiện khi kéo thả marker
        marker.addListener('dragend', function (event) {
            $('#location').val(`[${event.latLng.lat()}, ${event.latLng.lng()}]`);
        });
    }
    $('#location').val(`[${lat}, ${lng}]`);
}



// app
let markers = [], circle;
// Xóa danh sách các marker đang có trên map
function clearMarkers() {
    if (circle) {
        circle.setMap(null);
    }
    markers.forEach(function (m) {
        m.setMap(null);
    });
}

let icons = {
    'other': '/img/ic_other.png',
    'food_drink': '/img/ic_food_drink.png',
    'famous_area': '/img/ic_famous_area.png',
    'park': '/img/ic_park.png',
};
// Adds a marker to the map.
function addMarker(lat, lng, content, cate) {
    let position = { lat, lng };
    let marker = new google.maps.Marker({
        position,
        icon: icons[cate] || icons['other'],
        map: map
    });
    let infowindow = new google.maps.InfoWindow({
        content: content || "Không có mô tả."
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });
    return marker;
}
$(document).ready(function () {
    // Khi click nút thêm mới một điểm
    $('#btn_submit').on('click', function (event) {
        event.preventDefault();
        if (!marker) {
            return;
        }
        let category = $('#category').val();
        let desc = $('#desc').val();
        let location = JSON.parse($('#location').val());
        $.ajax({
            type: "POST",
            url: '/api/locations',
            data: {
                category,
                desc,
                lat: location[0],
                lng: location[1]
            },
            success: function (data) {
                console.log('onSuccess', data);
            }
        });
    });

    // Khi click nút tìm kiếm
    $('#btn_find').on('click', function (event) {
        event.preventDefault();
        (new Promise(function (res, rej) {
            if ($('#center_point').val() === 'marker') {
                let location = JSON.parse($('#location').val());
                res({ lat: location[0], lng: location[1] });
                return;
            }
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    let pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    res(pos)
                }, function () {
                    rej('Fail to get current position');
                });
            } else {
                rej('Browser doesn\'t support Geolocation')
            }
        }))
            .then(function (pos) {
                $.ajax({
                    type: "GET",
                    url: '/api/locations',
                    data: {
                        lat: pos.lat,
                        lng: pos.lng,
                    },
                    success: function (data) {
                        clearMarkers();
                        marker && marker.setPosition(pos);
                        circle = new google.maps.Circle({
                            strokeColor: '#ff0014',
                            strokeOpacity: 0.8,
                            strokeWeight: 1.3,
                            fillColor: '#1fff00',
                            fillOpacity: 0.2,
                            map: map,
                            center: pos,
                            radius: 5000
                        });
                        data.locations.forEach(function (loc) {
                            markers.push(addMarker(loc.loc[1], loc.loc[0], loc.desc, loc.category));
                        });
                    }
                });
            })
            .catch(function (err) {
                console.log(err);
            })
    });
});