import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  failed: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falló una sección de la aplicación.', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <section
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
          role="alert"
        >
          <h2 className="font-semibold">No pudimos mostrar esta sección</h2>
          <p className="mt-1 text-sm">Recarga la página para volver a intentarlo.</p>
        </section>
      );
    }
    return this.props.children;
  }
}
