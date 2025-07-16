export const rules = {
  name: [
    { required: true, message: "Name is required." },
    { max: 50, message: "Name cannot exceed 50 characters." },
  ],
  firstName: [
    { required: true, message: "First name is required." },
    { max: 50, message: "First name cannot exceed 50 characters." },
  ],
  lastName: [
    { required: true, message: "Last name is required." },
    { max: 50, message: "Last name cannot exceed 50 characters." },
  ],
  email: [
    { required: true, message: "Email is required." },
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      message: "Enter valid email address.",
    },
  ],
  mobile: [
    { required: true, message: "Mobile number is required." },
    { max: 12, message: "Mobile number cannot exceed 12 digits." },
  ],
  password: [
    {
      required: true,
      message: "Password is required.",
    },
    {
      min: 8,
      message: "Password must be at least 8 characters long.",
    },
    {
      pattern: /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)/,
      message:
        "Password requires alpha-numeric, capital, and special characters.",
    },
  ],
  user_appplatform: [
    {
      required: true,
      message: "Access app plat form is required.",
    },
  ],
  user_appgroups: [
    {
      required: true,
      message: "Group permission is required.",
    },
  ],
  form_group: [
    {
      required: true,
      message: "Form group is required.",
    },
  ],
  menu_form: [
    {
      required: true,
      message: "Menu form is required.",
    },
  ],
  user_type: [{ required: true, message: "User type is required." }],
  users_userhotel: [
    { required: true, message: "Users hotel form is required." },
  ],
  address_line_first: [
    { max: 250, message: "Address line 1 cannot exceed 250 characters." },
  ],
  address_line_second: [
    { max: 250, message: "Address line 2 cannot exceed 250 characters." },
  ],
  city: [{ max: 50, message: "City cannot exceed 50 characters." }],
  state: [{ max: 50, message: "State cannot exceed 50 characters." }],
  country: [{ max: 50, message: "Country cannot exceed 50 characters." }],
  zip_code: [{ max: 20, message: "Zip code cannot exceed 10 characters." }],
  special_notes: [
    { max: 500, message: "Special notes cannot exceed 500 characters." },
  ],
  module: [
    { required: true, message: "Module is required." },
    { max: 100, message: "Module cannot exceed 100 characters." },
  ],
  submodule: [
    { required: true, message: "Submodule is required." },
    { max: 100, message: "Submodule cannot exceed 100 characters." },
  ],
  codename: [
    { required: true, message: "Codename is required." },
    { max: 100, message: "Module cannot exceed 100 characters." },
  ],
  app_module_id: [
    { required: true, message: "Access app module is required." },
  ],
  app_grouppermission: [
    { required: true, message: "Access App Permission is required." },
  ],
  app_menu_group_permission: [
    {
      required: true,
      message: "Access App Menu Group Permission is required.",
    },
  ],
  app_moduleList_id: [{ required: true, message: "App Module is required." }],
  app_moduleForm_id: [{ required: true, message: "Module Form is required." }],
  code_name: [
    { required: true, message: "Code name is required." },
    { max: 20, message: "Code name cannot exceed 20 characters." },
  ],
  message: [{ required: true, message: "Message is required." }],
  fullName: [{ required: true, message: "Full Name is required." }],
  language: [{ required: true, message: "Language is required." }],
  label: [{ required: true, message: "Label is required." }],
  app_formField: [{ required: true, message: "App Form Fields is required." }],
  tag_text: [{ required: true, message: "Tag Text is required." }],
  tag_name: [{ required: true, message: "Tag Name is required." }],
  tag_value: [{ required: true, message: "Tag Value is required." }],
  path: [{ required: true, message: "Path is required." }],
};

export const placeholders = {
  name: "Enter a name",
  firstName: "Enter first name",
  lastName: "Enter last name",
  email: "Enter email address",
  mobile: "Enter mobile number",
  password: "Enter password",
  gender: "Select gender",
  user_appplatform: "Select access app platform",
  date_of_birth: "Select date of birth",
  user_appgroups: "Select group for allow that group permissions",
  user_type: "Select user type",
  users_userhotel: "Select user hotel",
  address_line_first: "Enter address first line",
  address_line_second: "Enter address second line",
  city: "Enter city name",
  state: "Enter state",
  country: "Enter country",
  zip_code: "Enter zip code",
  special_notes: "Enter special notes",
  module: "Enter module name",
  submodule: "Enter submodule name",
  codename: "Enter a codename",
  app_module_id: "Select access app module",
  app_grouppermission: "Select access app group permission",
  app_moduleList_id: "Select app module",
  app_moduleForm_id: "Select module form",
  moduleName: "Enter Module name",
  moduleFormName: "Enter module form name",
  fullName: "Enter Full Name",
  language: "Select language",
  shortName: "Enter short name",
  form_group: "Select a form group",
  menu_form: "Select a menu form",
  label: "Enter a Label",
  path: "Enter a path",
  icon: "Enter a icon",
  parent_key: "Select a parent menu",
  app_menu_group_permission: "Select access app menu group permission",
  order: "Enter a Order",
  messageType: "Select message type",
  statusCode: "Select status code",
  msg: "Enter a message",
  description: "Enter a description",
  accessPermission: "Enter access permission",
  setNumber: "Enter Set Number",
  tagText: "Enter tag text",
  tagName: "Enter tag name",
  tagValue: "Enter tag value",
  guestOrRoom: "Search by guest, room",
  searchHotel: "Search hotel...",
  emailp: "Please enter email address",
  passwordp: "Please enter password",
};
