import React, { useState } from 'react'
import '../../styles/Admin/AddOragnization.css'
import Nav from './nav';

type OrganizationForm = {
    companyName:string,
    UserName: string,
    email: string,
    phone: string,
    password: string,
    
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  full?: boolean;
};


function AddOrganization() {
    const [form, setForm] = useState<OrganizationForm>({
      companyName:"",
      UserName:"",
      email:"",
      phone:"",
      password: ""
    })

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({...form, [e.target.name]: e.target.value});
    }

    



  return (
    <div className='root'>
      <aside className='left'>
        <Nav label = {"AddOrganization"}/>
      </aside>
      <main className='center'>
        <header className='center-header'>
          <div className='title-block'>
            <div className='eyebrow'>Admin overview</div>
            <h1>Add Organization</h1>
            <p className='subtext'>Please Enter the Following Information</p>
          </div>
        </header>

        <div className="employee-form">
          <Input label="Company Name" name="companyName" value={form.companyName} onChange={onChange} />
          <Input label="UserName" name="UserName" value={form.UserName} onChange={onChange} />

          

          <Input label="Email Address" name="email" value={form.email} onChange={onChange} />
          <Input label="Phone Number" name="phone" value={form.phone} onChange={onChange} />

          <Input label="Password" name="password" value={form.password} onChange={onChange} />
          <Input label="Confirm Password" name="fax" value={form.password} onChange={onChange} />
        </div>

        <div className="employee-actions">
          <button className="btn primary">Save</button>
          <button className="btn ghost">Cancel</button>
        </div>
      </main>
    </div>
  )
}

function Input({ label, full, ...props }: InputProps) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}


export default AddOrganization
