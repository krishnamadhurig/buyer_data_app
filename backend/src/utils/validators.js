const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE=/^[6-9]\d{9}$/;

//turns anything into a trimmed string. Numbers, null and objects become ''

const text=(value)=>(typeof value==='string' ? value.trim() : '');

function validateRegister(body){
    const errors={};

    const name=text(body.name);
    const email=text(body.email);
    const mobile=text(body.mobile);
    const password=typeof body.password==='string'?body.password:'';

    //validate name
    if(name.length < 2){
        errors.name='Name must have at least 2 characters';
    }

    //validate email
    if(!EMAIL_RE.test(email)){
        errors.email='Enter a valid email address';
    }

    //validate indian mobile number
    if(!MOBILE_RE.test(mobile)){
        errors.mobile='Enter a valid 10-digit mobile number';
    }

    //validate password (bcrypt only reads the first72 character)
    if(password.length<8 || password.length>72){
        errors.password='Password must have 8 to 72 characters';
    }

    return errors;
}
module.exports = { validateRegister, EMAIL_RE, MOBILE_RE, text };