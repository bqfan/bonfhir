import { asError } from "@bonfhir/core/r5";
import { ReactElement } from "react";
import { useFhirUIContext } from "../context.js";

export interface FhirErrorProps<TRendererProps = any> {
  error?: unknown;
  onRetry?: () => void;
  rendererProps?: TRendererProps;
}

export function FhirError<TRendererProps = any>(
  props: FhirErrorProps<TRendererProps>,
): ReactElement | null {
  const { applyDefaultProps, render } = useFhirUIContext();
  props = applyDefaultProps("FhirError", props);

  return render<FhirErrorRendererProps>("FhirError", {
    ...props,
    error: asError(props.error),
  });
}

export interface FhirErrorRendererProps<TRendererProps = any>
  extends FhirErrorProps<TRendererProps> {
  error?: Error;
}

export type FhirErrorRenderer = (
  props: FhirErrorRendererProps,
) => ReactElement | null;
