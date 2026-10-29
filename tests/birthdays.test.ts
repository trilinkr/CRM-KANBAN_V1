import { describe, expect, it } from "vitest";
import { birthdayMessage, whatsappBirthdayUrl } from "../src/lib/birthdays";
describe("birthday WhatsApp messages", () => {
  it("personalises names literally and preserves line breaks", () => {
    expect(birthdayMessage("Hi {name}!\nHappy birthday, {name}.", "$&")).toBe("Hi $&!\nHappy birthday, $&.");
  });
  it("normalises Indian mobile numbers and encodes message content", () => {
    const url = whatsappBirthdayUrl("+91 87781 40024", "Happy birthday {name}!\nFrom TriLinkr", "Anu");
    expect(url).toBe("https://wa.me/918778140024?text=" + encodeURIComponent("Happy birthday Anu!\nFrom TriLinkr"));
    expect(whatsappBirthdayUrl("8778140024", "{name}", "Anu")).toContain("/918778140024?");
  });
  it("supports international numbers and rejects missing or invalid numbers", () => {
    expect(whatsappBirthdayUrl("+44 7700 900123", "{name}", "Anu")).toContain("/447700900123?");
    for (const phone of [null, "", "123", "abc8778140024"]) expect(whatsappBirthdayUrl(phone, "{name}", "Anu")).toBeNull();
  });
});
