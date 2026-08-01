import SwiftUI
import UIKit

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("Ro")
                .font(.system(size: 34, weight: .heavy))
                .foregroundColor(.primary)
            + Text("Cheap")
                .font(.system(size: 34, weight: .heavy))
                .foregroundColor(Color(red: 0.23, green: 0.65, blue: 0.36))

            Text("To use RoCheap, enable it in Settings → Safari → Extensions, then turn it on for roblox.com.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal, 32)

            Button(action: openSettings) {
                Text("Open Settings")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 0.23, green: 0.65, blue: 0.36))
                    .cornerRadius(10)
            }
            .padding(.horizontal, 32)

            Spacer()

            Text("Made By ImJustIvaan © 2026")
                .font(.footnote)
                .foregroundColor(.secondary)
        }
        .padding(.top, 60)
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

#Preview {
    ContentView()
}
