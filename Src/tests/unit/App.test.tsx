type MockPreferences = {
  manager: PreferencesManager;
  load: ReturnType<typeof vi.fn<() => Promise<Preferences | null>>>;
  save: ReturnType<typeof vi.fn<(preferences: Preferences) => Promise<void>>>;
};

function createMockPreferencesManager(initial?: Preferences | null): MockPreferences {
  const load = vi.fn(async () => initial ?? null);
  const save = vi.fn(async () => {});
  return {
    manager: {
      load,
      save,
    },
    load,
    save,
  };
}

function createAppDeps({
  preferences,
  transcribe,
}: {
  preferences?: MockPreferences;
  transcribe?: AppProps["transcribe"];
} = {}) {
  const prefs = preferences ?? createMockPreferencesManager({
    model: DEFAULT_MODEL,
    prompt: "transcribe-autodetect",
    apiKey: "",
  });

  const transcribeFn = transcribe ?? noopTranscribe;

  return {
    props: {
      preferencesManager: prefs.manager,
      transcribe: transcribeFn,
    },
    prefs,
    transcribe: transcribeFn,
  };
}

async function renderApp(options?: Parameters<typeof createAppDeps>[0]) {
  const deps = createAppDeps(options ?? {});
  const adapter = createMockAdapter();
  await act(async () => {
    render(<App recorderAdapter={adapter.adapter} {...deps.props} />);
  });
  return deps;
}

import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App, type AppProps } from "../../src/App";
import { DEFAULT_MODEL } from "../../src/constants/config";
import type {
  RecorderAdapter,
  RecordingResult,
} from "../../src/services/audioRecorder";
import type { Preferences, PreferencesManager } from "../../src/services/preferences";

const noopTranscribe = vi.fn(async () => ({ text: "" }));

const createObjectURLMock = vi.fn<(blob: Blob) => string>(() => "blob:mock-url");
const revokeObjectURLMock = vi.fn<(url: string) => void>(() => {});

let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

beforeAll(() => {
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURLMock,
  });

  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURLMock,
  });
});

afterEach(() => {
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
  noopTranscribe.mockClear();
});

afterAll(() => {
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
  } else {
    Reflect.deleteProperty(URL, "createObjectURL");
  }

  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  } else {
    Reflect.deleteProperty(URL, "revokeObjectURL");
  }
});

describe("App layout", () => {
  it("renders header branding and subtitle", async () => {
    await renderApp();
    expect(await screen.findByRole("heading", { name: /open-transcribe/i })).toBeInTheDocument();
    expect(screen.getByText(/ai-powered audio transcription/i)).toBeInTheDocument();
  });

  it("provides recording controls and status", async () => {
    await renderApp();
    await screen.findByRole("button", { name: /start recording/i });
    expect(screen.getByRole("status", { name: /recording status/i })).toHaveTextContent(/ready/i);
  });

  it("allows selecting model and prompt presets", async () => {
    await renderApp();
    await screen.findByLabelText(/model/i);
    expect(screen.getByLabelText(/model/i)).toHaveValue(DEFAULT_MODEL);
    expect(screen.getByLabelText(/prompt preset/i)).toBeInTheDocument();
    expect(screen.getByText(/produce a verbatim transcription/i)).toBeInTheDocument();
  });

  it("exposes transcription output area", async () => {
    await renderApp();
    await screen.findByRole("heading", { name: /transcription/i });
    expect(screen.getByRole("textbox", { name: /transcription output/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeDisabled();
  });

  it("records audio and shows a summary", async () => {
    const user = userEvent.setup();
    const deps = createAppDeps();
    const mock = createMockAdapter();
    await act(async () => {
      render(<App recorderAdapter={mock.adapter} {...deps.props} />);
    });

    const playback = screen.getByLabelText(/recording playback/i) as HTMLAudioElement;
    expect(playback).toHaveAttribute("aria-disabled", "true");
    expect(playback).not.toHaveAttribute("src");

    await user.click(screen.getByRole("button", { name: /start recording/i }));
    expect(mock.start).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await waitFor(() => {
      expect(mock.stop).toHaveBeenCalled();
      expect(screen.getByText(/last capture/i)).toBeInTheDocument();
      expect(playback).not.toHaveAttribute("aria-disabled");
      expect(playback).toHaveAttribute("src", "blob:mock-url");
    });
  });

  it("surfaces recorder errors to the UI", async () => {
    const user = userEvent.setup();
    const mock = createMockAdapter({ failRequest: true });
    const deps = createAppDeps();
    await act(async () => {
      render(<App recorderAdapter={mock.adapter} {...deps.props} />);
    });

    await user.click(screen.getByRole("button", { name: /start recording/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to acquire microphone/i);
    });
  });

  it("clears playback state when reset", async () => {
    const user = userEvent.setup();
    const mock = createMockAdapter();
    const deps = createAppDeps();
    await act(async () => {
      render(<App recorderAdapter={mock.adapter} {...deps.props} />);
    });

    await user.click(screen.getByRole("button", { name: /start recording/i }));
    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/recording playback/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /clear/i }));

    const playback = screen.getByLabelText(/recording playback/i) as HTMLAudioElement;
    expect(playback).toHaveAttribute("aria-disabled", "true");
    expect(playback).not.toHaveAttribute("src");
  });

  it("saves API key through preferences manager", async () => {
    const user = userEvent.setup();
    const prefs = createMockPreferencesManager();
    const deps = createAppDeps({ preferences: prefs });
    await act(async () => {
      render(<App {...deps.props} />);
    });

    const changeButton = await screen.findByRole("button", { name: /change api key/i });
    await user.click(changeButton);

    const apiKeyInput = await screen.findByLabelText(/gemini api key/i);
    await user.clear(apiKeyInput);
    await user.type(apiKeyInput, "test-key");
    await user.click(screen.getByRole("button", { name: /save api key/i }));

    await waitFor(() => {
      expect(prefs.save).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: "test-key" })
      );
    });
  });

  it("invokes transcription when requested", async () => {
    const user = userEvent.setup();
    const mock = createMockAdapter();
    const transcribe = vi.fn(async () => ({ text: "Hello world" }));
    const prefs = createMockPreferencesManager({
      model: DEFAULT_MODEL,
      prompt: "transcribe-autodetect",
      apiKey: "secret",
    });

    const deps = createAppDeps({ preferences: prefs, transcribe });
    await act(async () => {
      render(<App recorderAdapter={mock.adapter} {...deps.props} />);
    });

    await user.click(screen.getByRole("button", { name: /start recording/i }));
    await user.click(screen.getByRole("button", { name: /stop recording/i }));

    await user.click(screen.getByRole("button", { name: /transcribe recording/i }));

    await waitFor(() => {
      expect(transcribe).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /transcription output/i })).toHaveValue(
        "Hello world"
      );
    });
  });
});

type MockAdapterConfig = {
  failRequest?: boolean;
};

function createMockAdapter(config: MockAdapterConfig = {}) {
  const handlersRef: {
    current?: {
      onData: (chunk: Blob) => void;
      onError: (error: Error) => void;
      onStop: () => void;
    };
  } = {};

  const start = vi.fn(() => {
    handlersRef.current?.onData(new Blob(["chunk"], { type: "audio/webm" }));
  });

  const stop = vi.fn(() => {
    handlersRef.current?.onStop();
  });

  const dispose = vi.fn();

  const adapter: RecorderAdapter = {
    async requestStream() {
      if (config.failRequest) {
        throw new Error("Failed to acquire microphone access");
      }
      return {} as unknown as MediaStream;
    },
    createRecorder(_stream, handlers) {
      handlersRef.current = handlers;
      return {
        mimeType: "audio/webm",
        start,
        stop,
        dispose,
      };
    },
  };

  return {
    adapter,
    handlersRef,
    start,
    stop,
    dispose,
  };
}
