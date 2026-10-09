const env = import.meta.env.MODE || "prod"
const EnvConfig = {
    development: {
        baseApi: "/api",
        mockApi: "https://apifoxmock.com/ml/4068509-0default/api",
    },
    test: {
        baseApi: "//test.future.com/api",
        mockApi: "https://apifoxmock.com/ml/4068509-0default/api",
    },
    prod: {
        baseApi: "//future.com/api",
        mockApi: "https://apifoxmock.com/ml/4068509-0default/api",
    },
}
export default {
    env,
    ...EnvConfig[env],
    mock: false
}