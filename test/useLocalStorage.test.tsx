import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import useLocalStorage from "../src/index";

export function TestComponent() {
  const [data, setData] = useLocalStorage("username", "John Doe");
  return (
    <>
      <p>{data}</p>
      <button
        id="set-data"
        onClick={() => {
          setData("Burt");
        }}
      >
        Change Username
      </button>
      <button
        id="set-data-callback"
        onClick={() => {
          setData((data) => data + "foo");
        }}
      >
        Change Username
      </button>
      <button
        id="remove-data"
        onClick={() => {
          setData(undefined);
        }}
      >
        Remove Username
      </button>
    </>
  );
}

function WithLazyInitialState({ text }: { text: string }) {
  const [data] = useLocalStorage("username", () => text);
  return <p>{data}</p>;
}

function WithCustomParser() {
  const [data] = useLocalStorage("username", "John Doe", {
    parser: (val) => JSON.parse(val) + "kraw",
  });
  return <p>{data}</p>;
}

function WithCustomSerializer() {
  const [data] = useLocalStorage("username", "John Doe", {
    serializer: (val) => JSON.stringify(val + "char"),
  });
  return <p>{data}</p>;
}

function WithBadParser() {
  const [data] = useLocalStorage("username", "John Doe", {
    parser: () => {
      return JSON.parse(undefined as unknown as string);
    },
  });
  return <p>{data}</p>;
}

function WithBadSerializer() {
  const [data] = useLocalStorage("username", "John Doe", {
    serializer: () => {
      return JSON.parse(undefined as unknown as string);
    },
  });
  return <p>{data}</p>;
}

function WithDisabedSync() {
  const [data] = useLocalStorage("username", "John Doe", {
    syncData: false,
  });
  return <p>{data}</p>;
}

function WithMultipleSetterCallback() {
  const [data, setData] = useLocalStorage("username", "foo");

  return (
    <>
      <p>{data}</p>
      <button
        id="set-data-multiple-callback"
        onClick={() => {
          setData((data) => data + "bar");
          setData((data) => data + "bar");
          setData((data) => data + "bar");
          setData((data) => data + "bar");
        }}
      >
        Change Username
      </button>
    </>
  );
}

function CountRenders({ counter }: { counter: { value: number } }) {
  const [data, setData] = useLocalStorage("username", "foo");
  counter.value++;
  return (
    <>
      <p>{data}</p>
      <button id="stability" onClick={() => setData((data) => data + "bar")}>
        Change Username
      </button>
    </>
  );
}

function createStorageEventOption(
  key: string,
  newValue: string | null,
  storage?: Storage
) {
  return new StorageEvent("storage", {
    newValue,
    key,
    oldValue: null,
    storageArea: storage ?? window.localStorage,
  });
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, "error");
    jest.spyOn(console, "log");
    // @ts-ignore jest.spyOn adds this functionallity
    console.log.mockImplementation(() => null);
    // @ts-ignore jest.spyOn adds this functionallity
    console.error.mockImplementation(() => null);
  });
  afterEach(() => {
    // @ts-ignore jest.spyOn adds this functionallity
    console.log.mockRestore();
    // @ts-ignore jest.spyOn adds this functionallity
    console.error.mockRestore();
  });
  it("sets localStorage based on default value", () => {
    const { container } = render(<TestComponent />);
    expect(localStorage.getItem("username")).toEqual(
      JSON.stringify("John Doe")
    );
    expect(container.querySelector("p")).toHaveTextContent("John Doe");
  });
  it("gets localStorage value instead of default", () => {
    localStorage.setItem("username", JSON.stringify("Daffodil"));
    const { container } = render(<TestComponent />);
    expect(container.querySelector("p")).toHaveTextContent("Daffodil");
  });
  it("changes localstorage and state value", () => {
    localStorage.setItem("username", JSON.stringify("Daffodil"));
    const { container } = render(<TestComponent />);
    fireEvent.click(container.querySelector("#set-data")!);
    expect(container.querySelector("p")).toHaveTextContent("Burt");
    expect(localStorage.getItem("username")).toBe(JSON.stringify("Burt"));
  });
  it("changes localstorage and state value using callback", () => {
    localStorage.setItem("username", JSON.stringify("Daffodil"));
    const { container } = render(<TestComponent />);
    fireEvent.click(container.querySelector("#set-data-callback")!);
    expect(container.querySelector("p")).toHaveTextContent("Daffodilfoo");
    expect(localStorage.getItem("username")).toBe(
      JSON.stringify("Daffodilfoo")
    );
  });
  it("changes localStorage and state value correctly for multiple setter callbacks", () => {
    const { container } = render(<WithMultipleSetterCallback />);
    fireEvent.click(container.querySelector("#set-data-multiple-callback")!);
    expect(container.querySelector("p")).toHaveTextContent("foobarbarbarbar");
    expect(localStorage.getItem("username")).toBe(
      JSON.stringify("foobarbarbarbar")
    );
  });
  it("uses a lazy initial state", () => {
    const { container } = render(<WithLazyInitialState text="johndoe85kraw" />);
    expect(container.querySelector("p")).toHaveTextContent("johndoe85kraw");
  });
  it("uses a custom parser", () => {
    localStorage.setItem("username", JSON.stringify("johndoe85"));
    const { container } = render(<WithCustomParser />);
    expect(container.querySelector("p")).toHaveTextContent("johndoe85kraw");
  });
  it("uses a custom serializer", () => {
    render(<WithCustomSerializer />);
    expect(localStorage.getItem("username")).toBe(
      JSON.stringify("John Doechar")
    );
  });
  it("handles malformed local storage data", () => {
    localStorage.setItem("username", JSON.stringify("some data"));
    const { container } = render(<WithBadParser />);
    expect(console.log).toBeCalled();
    expect(container.querySelector("p")).toHaveTextContent("John Doe");
  });
  it("handles bad serializer", () => {
    const { container } = render(<WithBadSerializer />);
    expect(console.log).toBeCalled();
  });
  it("should sync data from other tab", function () {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption("username", JSON.stringify("Test Sync"))
    );
    expect(container.querySelector("p")).toHaveTextContent("Test Sync");
  });
  it("should not sync data from other tab when sync disabled", function () {
    const { container } = render(<WithDisabedSync />);

    fireEvent(
      window,
      createStorageEventOption("username", JSON.stringify("Test Sync"))
    );
    expect(container.querySelector("p")).toHaveTextContent("John Doe");
  });
  it("should not sync data from other tab when key is different", function () {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption("otherkey", JSON.stringify("Test Sync"))
    );
    expect(container.querySelector("p")).toHaveTextContent("John Doe");
  });
  it("should not sync data from other tab when event is from other storage", function () {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption(
        "username",
        JSON.stringify("Test Sync"),
        window.sessionStorage
      )
    );
    expect(container.querySelector("p")).toHaveTextContent("John Doe");
  });
  it("should log on storage sync error", function () {
    render(<TestComponent />);

    fireEvent(window, createStorageEventOption("username", "malformed"));
    expect(console.log).toBeCalled();
  });
  it("should return undefined when other tab deletes storage item", function () {
    const { container } = render(<TestComponent />);

    fireEvent(window, createStorageEventOption("username", null));
    expect(container.querySelector("p")).toHaveTextContent("");
  });
  it("should remove item from localStorage when value is set as undefined", () => {
    const { container } = render(<TestComponent />);

    fireEvent.click(container.querySelector("#remove-data")!);
    expect(container.querySelector("p")).toHaveTextContent("");
    expect(localStorage.getItem("username")).toBe(null);
  });
  it("should be able to set value again after it was removed from localStorage", () => {
    const { container } = render(<TestComponent />);

    fireEvent.click(container.querySelector("#remove-data")!);
    fireEvent.click(container.querySelector("#set-data")!);
    expect(localStorage.getItem("username")).toBe(JSON.stringify("Burt"));
  });
  it("triggers a re-render only the needed amount of times", () => {
    const counter = { value: 0 };
    expect(counter.value).toBe(0);
    const { container } = render(<CountRenders counter={counter} />);
    expect(counter.value).toBe(1);
    fireEvent.click(container.querySelector("#stability")!);
    expect(counter.value).toBe(2);
    expect(localStorage.getItem("username")).toEqual(JSON.stringify("foobar"));
  });
});
