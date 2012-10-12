IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -O2 -m64 

.cpp.o :
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testSortedSets testBalancedBsts testSelfAdjBsts testTreeMap \
	testSaTreeMap

testSortedSets: testSortedSets.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testBalancedBsts: testBalancedBsts.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSelfAdjBsts: testSelfAdjBsts.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testTreeMap: testTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSaTreeMap: testSaTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
