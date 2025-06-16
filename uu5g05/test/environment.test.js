import { Environment } from "uu5g05";

describe("[uu5g05] Environment", () => {
  it("trustedUriRegExp", () => {
    let re = new RegExp(Environment.trustedUriRegExp);
    expect("https://plus4u.net").toMatch(re);
    expect("https://plus4u.net/uu-app/1234").toMatch(re);
    expect("https://uuapp.plus4u.net").toMatch(re);
    expect("https://uuapp.plus4u.net:443").toMatch(re);

    expect("https://plus4u.nett").not.toMatch(re);
    expect("https://uuapp.plus4u.nett").not.toMatch(re);
    expect("https://example.com/.plus4u.net/").not.toMatch(re);
    expect("https://plus4u.net:pass@attacker.com").not.toMatch(re);
    expect("https://plus4u.net:pass@attacker.com/").not.toMatch(re);
    expect("https://uuapp.plus4u.net:443@attacker.com/").not.toMatch(re);
    expect("https://3558754691\n.plus4u.net/").not.toMatch(re);
    expect("https://3558754691#.plus4u.net/").not.toMatch(re);
    expect("https://3558754691?.plus4u.net/").not.toMatch(re);
    expect("https://3558754691\\.plus4u.net/").not.toMatch(re);
  });
});
