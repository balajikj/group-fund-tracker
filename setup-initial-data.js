// Initial Data Setup Script
// This script helps you populate initial test data into Firestore
// Run this in the browser console after logging in as an Admin

async function setupInitialData() {
    console.log('Starting initial data setup...');
    
    try {
        // Sample member data (excluding yourself)
        const sampleMembers = [
            { id: 'member1', name: 'Alice Johnson', role: 'Member', lifetimeContribution: 1200 },
            { id: 'member2', name: 'Bob Smith', role: 'Member', lifetimeContribution: 1500 },
            { id: 'member3', name: 'Charlie Brown', role: 'CoAdmin', lifetimeContribution: 1800 },
            { id: 'member4', name: 'Diana Prince', role: 'Member', lifetimeContribution: 900 },
            { id: 'member5', name: 'Ethan Hunt', role: 'Member', lifetimeContribution: 1100 },
            { id: 'member6', name: 'Fiona Green', role: 'Member', lifetimeContribution: 1400 },
            { id: 'member7', name: 'George Wilson', role: 'Member', lifetimeContribution: 1000 },
            { id: 'member8', name: 'Hannah Lee', role: 'Member', lifetimeContribution: 1300 }
        ];
        
        // Note: Create these users manually in Firebase Authentication first
        // Then update the IDs here with their actual Firebase Auth UIDs
        
        console.log('Adding members...');
        for (const member of sampleMembers) {
            await db.collection('members').doc(member.id).set({
                name: member.name,
                role: member.role,
                lifetimeContribution: member.lifetimeContribution
            });
            console.log(`Added member: ${member.name}`);
        }
        
        // Sample contributions
        console.log('Adding sample contributions...');
        const contributions = [
            { memberId: 'member1', type: 'Contribution-Monthly', amount: 200, daysAgo: 60 },
            { memberId: 'member1', type: 'Contribution-Monthly', amount: 200, daysAgo: 30 },
            { memberId: 'member1', type: 'Contribution-Monthly', amount: 200, daysAgo: 5 },
            
            { memberId: 'member2', type: 'Contribution-Quarterly', amount: 500, daysAgo: 90 },
            { memberId: 'member2', type: 'Contribution-Quarterly', amount: 500, daysAgo: 10 },
            
            { memberId: 'member3', type: 'Contribution-Monthly', amount: 300, daysAgo: 45 },
            { memberId: 'member3', type: 'Contribution-Monthly', amount: 300, daysAgo: 15 },
            
            { memberId: 'member4', type: 'Contribution-Monthly', amount: 150, daysAgo: 40 },
            { memberId: 'member4', type: 'Contribution-Monthly', amount: 150, daysAgo: 8 },
            
            { memberId: 'member5', type: 'Contribution-Monthly', amount: 200, daysAgo: 50 },
            { memberId: 'member5', type: 'Contribution-Monthly', amount: 200, daysAgo: 20 },
            
            { memberId: 'member6', type: 'Contribution-Monthly', amount: 200, daysAgo: 35 },
            { memberId: 'member6', type: 'Contribution-Monthly', amount: 200, daysAgo: 7 },
            
            { memberId: 'member7', type: 'Contribution-Quarterly', amount: 500, daysAgo: 80 },
            
            { memberId: 'member8', type: 'Contribution-Monthly', amount: 200, daysAgo: 25 },
            { memberId: 'member8', type: 'Contribution-Monthly', amount: 200, daysAgo: 3 }
        ];
        
        for (const contrib of contributions) {
            const date = new Date();
            date.setDate(date.getDate() - contrib.daysAgo);
            
            await db.collection('transactions').add({
                memberId: contrib.memberId,
                type: contrib.type,
                amount: contrib.amount,
                date: firebase.firestore.Timestamp.fromDate(date),
                loanId: null
            });
        }
        console.log(`Added ${contributions.length} contributions`);
        
        // Sample loans
        console.log('Adding sample loans...');
        
        // Loan 1 - Active, due soon
        const loan1Date = new Date();
        loan1Date.setDate(loan1Date.getDate() - 20);
        const loan1Due = new Date();
        loan1Due.setDate(loan1Due.getDate() + 10);
        
        const loan1Ref = await db.collection('loans').add({
            borrowerId: 'member2',
            amount: 500,
            borrowDate: firebase.firestore.Timestamp.fromDate(loan1Date),
            dueDate: firebase.firestore.Timestamp.fromDate(loan1Due),
            status: 'Outstanding'
        });
        
        await db.collection('transactions').add({
            memberId: 'member2',
            type: 'Loan-Disbursement',
            amount: -500,
            date: firebase.firestore.Timestamp.fromDate(loan1Date),
            loanId: loan1Ref.id
        });
        
        // Loan 2 - Active, due in future
        const loan2Date = new Date();
        loan2Date.setDate(loan2Date.getDate() - 10);
        const loan2Due = new Date();
        loan2Due.setDate(loan2Due.getDate() + 20);
        
        const loan2Ref = await db.collection('loans').add({
            borrowerId: 'member5',
            amount: 300,
            borrowDate: firebase.firestore.Timestamp.fromDate(loan2Date),
            dueDate: firebase.firestore.Timestamp.fromDate(loan2Due),
            status: 'Outstanding'
        });
        
        await db.collection('transactions').add({
            memberId: 'member5',
            type: 'Loan-Disbursement',
            amount: -300,
            date: firebase.firestore.Timestamp.fromDate(loan2Date),
            loanId: loan2Ref.id
        });
        
        // Loan 3 - Returned
        const loan3Date = new Date();
        loan3Date.setDate(loan3Date.getDate() - 60);
        const loan3Due = new Date();
        loan3Due.setDate(loan3Due.getDate() - 30);
        const loan3Return = new Date();
        loan3Return.setDate(loan3Return.getDate() - 35);
        
        const loan3Ref = await db.collection('loans').add({
            borrowerId: 'member4',
            amount: 200,
            borrowDate: firebase.firestore.Timestamp.fromDate(loan3Date),
            dueDate: firebase.firestore.Timestamp.fromDate(loan3Due),
            status: 'Returned'
        });
        
        await db.collection('transactions').add({
            memberId: 'member4',
            type: 'Loan-Disbursement',
            amount: -200,
            date: firebase.firestore.Timestamp.fromDate(loan3Date),
            loanId: loan3Ref.id
        });
        
        await db.collection('transactions').add({
            memberId: 'member4',
            type: 'Loan-Return',
            amount: 200,
            date: firebase.firestore.Timestamp.fromDate(loan3Return),
            loanId: loan3Ref.id
        });
        
        console.log('Added 3 sample loans');
        
        console.log('✅ Initial data setup complete!');
        console.log('Reload the page to see the data.');
        
    } catch (error) {
        console.error('Error setting up initial data:', error);
    }
}

// Instructions to run:
// 1. Open the application in your browser
// 2. Login as an Admin user
// 3. Open browser console (F12)
// 4. Copy and paste this entire script
// 5. Run: setupInitialData()

console.log('Initial data setup script loaded.');
console.log('To run, execute: setupInitialData()');
