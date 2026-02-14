import { Text } from '@radix-ui/themes'

export type LoadingIndicatorProps = {
  message: string
}

export default function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-centered-container">
        <img className="loading-openhome-logo-back" src="/logos/logo-back.png" />
        <img className="loading-openhome-logo-letter" src="/logos/logo-letter.png" />
        <Text className="loading-message" size="6" weight="bold">
          {message}
        </Text>
      </div>
    </div>
  )
}
