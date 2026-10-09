
const regs = {
    email: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,
    // 手机号正则（国内手机号格式）
    number: /^\+?[1-9][0-9]*$/,
    // 密码正则：必须包含数字、大小写字母、特殊字符，长度 8 位及以上
    password: /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*_]{8,}$/,
    // 版本号正则（数字格式）
    version: /^[0-9.]+$/
}


const verify = (rule, value, reg, callback) => {
    if (value) {
        if (reg.test(value)) {
            callback();
        } else {
            callback(new Error(rule.message))
        }
    } else {
        callback()
    }
}

const checkPassword = (value) => {
    return regs.password.test(value)
}
const checkEmail = (value) => {
    return regs.email.test(value)
}

const password = (rule, value, callback) => {
    return verify(rule, value, regs.password, callback)
}
const number = (rule, value, callback) => {
    return verify(rule, value, regs.password, callback)
}

export default {
    checkPassword,
    checkEmail,
    password,
    number,
}