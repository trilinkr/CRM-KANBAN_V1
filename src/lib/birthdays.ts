export const BIRTHDAY_TEMPLATE_KEY = "birthday_message_template";
export const DEFAULT_BIRTHDAY_TEMPLATE = "Happy Birthday, {name}! 🎂🎉\n\nWishing you a wonderful day and a year full of happiness and success. Best wishes from all of us at TriLinkr!";
export function birthdayMessage(template: string, name: string) {
  return template.replace(/\{name\}/g, () => name);
}
export function whatsappBirthdayUrl(phone: string | null, template: string, name: string) {
  if (!phone || !/^[+\d\s().-]+$/.test(phone)) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = "91" + digits;
  if (!/^[1-9]\d{9,14}$/.test(digits)) return null;
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(birthdayMessage(template, name));
}
