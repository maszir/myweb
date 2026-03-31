import React from 'react';

export default class ErrorBoundary extends React.Component<any, any> {
  state: { hasError: boolean };
  props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Something went wrong.</h2>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
