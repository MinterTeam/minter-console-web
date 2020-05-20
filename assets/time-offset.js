let averageOffset = 0;
let offsetArray = [];

export function getTimeOffset() {
    return averageOffset;
}

export function addTimeInterceptor(instance) {
    instance.interceptors.request.use((request) => {
        request.ts = Date.now();
        return request;
    });

    instance.interceptors.response.use((response) => {
        console.log(response.headers);
        const responseTime = new Date(response.headers.date).getTime();
        updateOffset(response.config.ts, responseTime);
        return response;
    });
}

function updateOffset(requestTime, responseTime) {
    // responseTime = performance.now() + 10 * 1000;
    if (!responseTime || isNaN(responseTime)) {
        return;
    }
    const currentOffset = ntpOffset(requestTime, responseTime, responseTime, Date.now());
    offsetArray.push(currentOffset);

    if (offsetArray.length >= 3) {
        const offsetSum = offsetArray.reduce((a, b) => a + b);
        averageOffset = Math.round(offsetSum / offsetArray.length);
    }
}

// the NTP algorithm
// t0 is the client's timestamp of the request packet transmission,
// t1 is the server's timestamp of the request packet reception,
// t2 is the server's timestamp of the response packet transmission and
// t3 is the client's timestamp of the response packet reception.
function ntpOffset(t0, t1, t2, t3) {
    return Math.round(((t1 - t0) + (t2 - t3)) / 2);
}
